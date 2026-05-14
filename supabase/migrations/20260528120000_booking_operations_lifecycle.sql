-- Booking operations: lifecycle statuses, timestamps, operator attribution,
-- internal notes, checklists, deposit tracking, overlap fix (exclude completed),
-- customers read-only on bookings (no direct status updates from anon JWT).

-- ---------------------------------------------------------------------------
-- bookings: new columns
-- ---------------------------------------------------------------------------
alter table public.bookings add column if not exists approved_at timestamptz;
alter table public.bookings add column if not exists handed_over_at timestamptz;
alter table public.bookings add column if not exists returned_at timestamptz;
alter table public.bookings add column if not exists completed_at timestamptz;

alter table public.bookings add column if not exists approved_by uuid;
alter table public.bookings add column if not exists handed_over_by uuid;
alter table public.bookings add column if not exists completed_by uuid;

alter table public.bookings add column if not exists admin_internal_notes text;

alter table public.bookings add column if not exists deposit_held_rupees bigint;
alter table public.bookings add column if not exists deposit_refunded_at timestamptz;
alter table public.bookings add column if not exists deposit_refunded_rupees bigint;

alter table public.bookings add column if not exists pickup_checklist jsonb not null default '{}'::jsonb;
alter table public.bookings add column if not exists return_checklist jsonb not null default '{}'::jsonb;

comment on column public.bookings.admin_internal_notes is 'Staff-only; never shown to customers in app selects.';
comment on column public.bookings.ops_note is 'Operational / customer-visible context for cancellations and rejections.';
comment on column public.bookings.pickup_checklist is 'JSON map of checklist item id -> done (boolean).';
comment on column public.bookings.return_checklist is 'JSON map of checklist item id -> done (boolean).';

-- ---------------------------------------------------------------------------
-- booking_status: add active (vehicle handed over, trip in progress)
-- ---------------------------------------------------------------------------
alter table public.bookings drop constraint if exists bookings_booking_status_check;

alter table public.bookings
  add constraint bookings_booking_status_check check (
    booking_status in (
      'pending_payment',
      'confirmed',
      'active',
      'completed',
      'cancelled'
    )
  );

-- ---------------------------------------------------------------------------
-- Overlap RPCs: only blocking lifecycle rows (not cancelled or completed)
-- ---------------------------------------------------------------------------
create or replace function public.has_booking_overlap (
  p_car_id uuid,
  p_pickup timestamptz,
  p_return timestamptz,
  p_exclude_booking_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.vehicle_id = p_car_id
      and b.booking_status in ('pending_payment', 'confirmed', 'active')
      and b.pickup_date < p_return
      and b.return_date > p_pickup
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
  );
$$;

revoke all on function public.has_booking_overlap (uuid, timestamptz, timestamptz, uuid) from public;
grant execute on function public.has_booking_overlap (uuid, timestamptz, timestamptz, uuid) to anon,
authenticated;

create or replace function public.has_vehicle_booking_overlap (
  p_vehicle_id uuid,
  p_pickup timestamptz,
  p_return timestamptz,
  p_exclude_booking_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.vehicle_id = p_vehicle_id
      and b.booking_status in ('pending_payment', 'confirmed', 'active')
      and b.pickup_date < p_return
      and b.return_date > p_pickup
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
  );
$$;

revoke all on function public.has_vehicle_booking_overlap (uuid, timestamptz, timestamptz, uuid) from public;
grant execute on function public.has_vehicle_booking_overlap (uuid, timestamptz, timestamptz, uuid) to anon,
authenticated;

comment on function public.has_vehicle_booking_overlap is
  'True when another booking in pending_payment, confirmed, or active overlaps [pickup, return). Completed and cancelled do not block.';

-- ---------------------------------------------------------------------------
-- Security: customers cannot UPDATE bookings (status changes are admin/service only)
-- ---------------------------------------------------------------------------
drop policy if exists "bookings_update_own" on public.bookings;
