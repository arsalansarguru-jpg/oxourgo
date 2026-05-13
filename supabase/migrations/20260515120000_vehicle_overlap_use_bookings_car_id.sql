-- Align overlap check with bookings.car_id (catalog vehicle UUID).
-- RPC argument name stays p_vehicle_id for existing clients.

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
      and b.pickup_at < p_return
      and b.return_at > p_pickup
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
  );
$$;

revoke all on function public.has_vehicle_booking_overlap (uuid, timestamptz, timestamptz, uuid) from public;
grant execute on function public.has_vehicle_booking_overlap (uuid, timestamptz, timestamptz, uuid) to anon,
authenticated;

comment on function public.has_vehicle_booking_overlap is 'True when another non-cancelled booking overlaps [pickup, return) for this catalog vehicle (matches bookings.car_id to vehicles.id).';
