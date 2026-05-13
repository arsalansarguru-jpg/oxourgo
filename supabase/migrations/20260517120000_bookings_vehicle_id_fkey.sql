-- Booking inventory: use vehicle_id -> public.vehicles (rename from car_id when applicable).
-- Recreates overlap RPCs to filter on b.vehicle_id.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'car_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'vehicle_id'
  ) then
    alter table public.bookings rename column car_id to vehicle_id;
  end if;
end $$;

alter table public.bookings drop constraint if exists bookings_car_id_fkey;
alter table public.bookings drop constraint if exists bookings_inventory_one_chk;
alter table public.bookings drop constraint if exists bookings_vehicle_id_fkey;

alter table public.bookings
  add constraint bookings_vehicle_id_fkey foreign key (vehicle_id) references public.vehicles (id) on delete restrict;

drop index if exists public.bookings_car_dates_idx;
drop index if exists public.bookings_vehicle_dates_idx;
create index if not exists bookings_vehicle_id_dates_idx on public.bookings (vehicle_id, pickup_date, return_date);

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
    where b.vehicle_id = p_vehicle_id
      and b.booking_status not in ('cancelled')
      and b.pickup_date < p_return
      and b.return_date > p_pickup
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
  );
$$;

revoke all on function public.has_vehicle_booking_overlap (uuid, timestamptz, timestamptz, uuid) from public;
grant execute on function public.has_vehicle_booking_overlap (uuid, timestamptz, timestamptz, uuid) to anon,
authenticated;
