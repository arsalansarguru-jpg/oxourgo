-- Link bookings to public catalog `vehicles` (catalog rows) while keeping legacy `cars` bookings.

alter table public.bookings add column if not exists vehicle_id uuid references public.vehicles (id) on delete restrict;

alter table public.bookings alter column car_id drop not null;

alter table public.bookings drop constraint if exists bookings_inventory_one_chk;
alter table public.bookings add constraint bookings_inventory_one_chk check (
  (car_id is not null and vehicle_id is null)
  or (car_id is null and vehicle_id is not null)
);

create index if not exists bookings_vehicle_id_idx on public.bookings (vehicle_id);
create index if not exists bookings_vehicle_dates_idx on public.bookings (vehicle_id, pickup_at, return_at);

-- Overlap for catalog vehicles (same semantics as has_booking_overlap for cars).
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
      and b.booking_status not in ('cancelled')
      and b.pickup_at < p_return
      and b.return_at > p_pickup
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
  );
$$;

revoke all on function public.has_vehicle_booking_overlap (uuid, timestamptz, timestamptz, uuid) from public;
grant execute on function public.has_vehicle_booking_overlap (uuid, timestamptz, timestamptz, uuid) to anon,
authenticated;

comment on function public.has_vehicle_booking_overlap is 'True when another non-cancelled booking overlaps [pickup, return) for this catalog vehicle.';
