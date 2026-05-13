-- Rename booking window columns (still timestamptz).
-- Recreates overlap RPC bodies to reference the new names.

alter table public.bookings rename column pickup_at to pickup_date;
alter table public.bookings rename column return_at to return_date;

alter table public.bookings drop constraint if exists bookings_return_after_pickup;
alter table public.bookings add constraint bookings_return_after_pickup check (return_date > pickup_date);

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
    where b.car_id = p_car_id
      and b.booking_status not in ('cancelled')
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
    where b.car_id = p_vehicle_id
      and b.booking_status not in ('cancelled')
      and b.pickup_date < p_return
      and b.return_date > p_pickup
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
  );
$$;

revoke all on function public.has_vehicle_booking_overlap (uuid, timestamptz, timestamptz, uuid) from public;
grant execute on function public.has_vehicle_booking_overlap (uuid, timestamptz, timestamptz, uuid) to anon,
authenticated;
