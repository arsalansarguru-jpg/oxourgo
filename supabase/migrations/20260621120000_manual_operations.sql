-- Manual operations: booking holds, VIP/flags, vehicle swap history, ops activity log, fleet modes.

-- ---------------------------------------------------------------------------
-- bookings: operational holds and override flags
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists ops_hold_at timestamptz,
  add column if not exists ops_hold_reason text,
  add column if not exists vip_flag boolean not null default false,
  add column if not exists customer_flags jsonb not null default '{}'::jsonb,
  add column if not exists restrictions_bypass boolean not null default false,
  add column if not exists custom_discount_rupees integer not null default 0
    check (custom_discount_rupees >= 0 and custom_discount_rupees <= 100000000);

comment on column public.bookings.ops_hold_at is 'When set, ops workflows should treat booking as on hold until cleared.';
comment on column public.bookings.restrictions_bypass is 'Allows admin overlap/KYC/availability bypass when true (audited).';
comment on column public.bookings.customer_flags is 'Staff flags: vip, high_risk, repeat_offender, etc. (json object).';

-- ---------------------------------------------------------------------------
-- vehicles: extended fleet operational modes
-- ---------------------------------------------------------------------------
alter table public.vehicles drop constraint if exists vehicles_availability_status_check;
alter table public.vehicles
  add constraint vehicles_availability_status_check
  check (
    availability_status in (
      'available',
      'unavailable',
      'maintenance',
      'service',
      'accident_hold'
    )
  );

alter table public.vehicles add column if not exists fleet_ops_note text;
comment on column public.vehicles.fleet_ops_note is 'Internal fleet ops note (accident, service window, etc.).';

-- ---------------------------------------------------------------------------
-- booking_vehicle_assignments: immutable vehicle swap history
-- ---------------------------------------------------------------------------
create table if not exists public.booking_vehicle_assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  from_vehicle_id uuid references public.vehicles (id) on delete set null,
  to_vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  changed_by uuid references auth.users (id) on delete set null,
  reason text,
  recalculate_pricing boolean not null default false,
  previous_total_rupees integer,
  new_total_rupees integer,
  created_at timestamptz not null default now()
);

create index if not exists booking_vehicle_assignments_booking_idx
  on public.booking_vehicle_assignments (booking_id, created_at desc);

alter table public.booking_vehicle_assignments enable row level security;

drop policy if exists "booking_vehicle_assignments_staff_read" on public.booking_vehicle_assignments;
create policy "booking_vehicle_assignments_staff_read" on public.booking_vehicle_assignments
  for select to authenticated
  using (public.is_ops_staff());

drop policy if exists "booking_vehicle_assignments_no_client_write" on public.booking_vehicle_assignments;
create policy "booking_vehicle_assignments_no_client_write" on public.booking_vehicle_assignments
  for all to authenticated
  using (false)
  with check (false);

comment on table public.booking_vehicle_assignments is 'Append-only vehicle assignment changes per booking; writes via service role.';

-- ---------------------------------------------------------------------------
-- booking_ops_activity: immutable per-booking ops timeline
-- ---------------------------------------------------------------------------
create table if not exists public.booking_ops_activity (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  activity_type text not null,
  summary text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists booking_ops_activity_booking_idx
  on public.booking_ops_activity (booking_id, created_at desc);

alter table public.booking_ops_activity enable row level security;

drop policy if exists "booking_ops_activity_staff_read" on public.booking_ops_activity;
create policy "booking_ops_activity_staff_read" on public.booking_ops_activity
  for select to authenticated
  using (public.is_ops_staff());

drop policy if exists "booking_ops_activity_no_client_write" on public.booking_ops_activity;
create policy "booking_ops_activity_no_client_write" on public.booking_ops_activity
  for all to authenticated
  using (false)
  with check (false);

comment on table public.booking_ops_activity is 'Immutable ops activity per booking; inserts via service role only.';
