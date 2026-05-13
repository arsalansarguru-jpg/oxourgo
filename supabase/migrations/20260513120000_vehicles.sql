-- Public catalog: vehicles shown on marketing site and fleet (separate from legacy admin `cars`).

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  transmission text not null,
  fuel_type text not null,
  seats integer not null check (seats > 0 and seats <= 12),
  price_per_day numeric not null check (price_per_day >= 0),
  image text,
  featured boolean not null default false,
  availability_status text not null default 'available'
    check (availability_status in ('available', 'unavailable', 'maintenance')),
  year integer not null default 2024 check (year >= 1990 and year <= 2100),
  registration_number text not null default '',
  security_deposit numeric not null default 0 check (security_deposit >= 0),
  created_at timestamptz not null default now()
);

create index if not exists vehicles_featured_created_idx on public.vehicles (featured desc, created_at desc);
create index if not exists vehicles_availability_idx on public.vehicles (availability_status);

comment on table public.vehicles is 'Customer-facing fleet rows for homepage and /fleet; image = absolute URL or path in public fleet storage bucket.';

alter table public.vehicles enable row level security;

drop policy if exists "vehicles_select_public" on public.vehicles;
create policy "vehicles_select_public" on public.vehicles for select using (true);
