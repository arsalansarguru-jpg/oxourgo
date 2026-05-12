-- Oxour Go: reservations + overlap-safe checks.
-- Run in Supabase SQL Editor or via supabase db push after linking the project.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  pickup_at timestamptz not null,
  return_at timestamptz not null,
  pickup_location text not null,
  return_location text not null,
  rental_days integer not null check (rental_days >= 1 and rental_days <= 60),
  price_per_day_rupees_snapshot integer not null check (price_per_day_rupees_snapshot > 0),
  subtotal_rupees bigint not null,
  convenience_fee_rupees bigint not null default 0,
  gst_rupees bigint not null default 0,
  total_rupees bigint not null,
  booking_status text not null default 'confirmed'
    check (booking_status in ('pending_payment', 'confirmed', 'cancelled', 'completed')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'authorized', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_return_after_pickup check (return_at > pickup_at)
);

create index if not exists bookings_car_id_idx on public.bookings (car_id);
create index if not exists bookings_user_id_idx on public.bookings (user_id);
create index if not exists bookings_car_dates_idx on public.bookings (car_id, pickup_at, return_at);

comment on table public.bookings is 'Customer reservations; overlap checks use has_booking_overlap().';

-- SECURITY DEFINER: overlap detection without exposing other customers rows to clients.
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
      and b.pickup_at < p_return
      and b.return_at > p_pickup
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
  );
$$;

revoke all on function public.has_booking_overlap (uuid, timestamptz, timestamptz, uuid) from public;
grant execute on function public.has_booking_overlap (uuid, timestamptz, timestamptz, uuid) to anon,
authenticated;

alter table public.bookings enable row level security;

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own" on public.bookings for select to authenticated using (auth.uid() = user_id);

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "bookings_update_own" on public.bookings;
create policy "bookings_update_own" on public.bookings for update to authenticated using (auth.uid() = user_id)
with check (auth.uid() = user_id);
