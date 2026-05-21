-- Production schema alignment: idempotent repair for bookings/payments columns and fleet inventory units.
-- Safe to run on databases that partially applied earlier migrations.

-- ---------------------------------------------------------------------------
-- bookings: payment + ops columns (20260601100000+)
-- ---------------------------------------------------------------------------
alter table public.bookings add column if not exists payment_method text default 'pay_at_pickup';
alter table public.bookings add column if not exists amount_due bigint;
alter table public.bookings add column if not exists amount_paid bigint;
alter table public.bookings add column if not exists payment_received_at timestamptz;
alter table public.bookings add column if not exists payment_received_by uuid references auth.users (id) on delete set null;
alter table public.bookings add column if not exists payment_notes text;
alter table public.bookings add column if not exists ops_note text;
alter table public.bookings add column if not exists admin_internal_notes text;
alter table public.bookings add column if not exists booking_source text not null default 'website';
alter table public.bookings add column if not exists deleted_at timestamptz;
alter table public.bookings add column if not exists archived_at timestamptz;
alter table public.bookings add column if not exists archived_by uuid references auth.users (id) on delete set null;

update public.bookings
set payment_method = 'pay_at_pickup'
where payment_method is null or trim(payment_method) = '';

update public.bookings
set amount_paid = coalesce(amount_paid, 0),
    amount_due = coalesce(amount_due, greatest(0, coalesce(total_rupees, 0) - coalesce(amount_paid, 0)))
where amount_paid is null or amount_due is null;

alter table public.bookings drop constraint if exists bookings_payment_method_chk;
alter table public.bookings
  add constraint bookings_payment_method_chk check (payment_method in ('pay_at_pickup', 'pay_online', 'online_payment'));

alter table public.bookings drop constraint if exists bookings_payment_status_check;
alter table public.bookings
  add constraint bookings_payment_status_check check (
    payment_status in ('pending', 'received', 'partial', 'refunded', 'authorized', 'paid', 'failed')
  );

-- ---------------------------------------------------------------------------
-- bookings: gateway + deposit + inspection (later migrations)
-- ---------------------------------------------------------------------------
alter table public.bookings add column if not exists payment_gateway text;
alter table public.bookings add column if not exists payment_gateway_order_id text;
alter table public.bookings add column if not exists payment_gateway_payment_id text;
alter table public.bookings add column if not exists payment_checkout_status text not null default 'not_started';
alter table public.bookings add column if not exists deposit_amount integer;
alter table public.bookings add column if not exists deposit_status text not null default 'pending';
alter table public.bookings add column if not exists deposit_received_at timestamptz;
alter table public.bookings add column if not exists refund_amount integer not null default 0;
alter table public.bookings add column if not exists penalty_total integer not null default 0;
alter table public.bookings add column if not exists deductions jsonb not null default '{}'::jsonb;
alter table public.bookings add column if not exists financial_manual_override boolean not null default false;
alter table public.bookings add column if not exists ops_hold_at timestamptz;
alter table public.bookings add column if not exists ops_hold_reason text;
alter table public.bookings add column if not exists vip_flag boolean not null default false;
alter table public.bookings add column if not exists customer_flags jsonb not null default '{}'::jsonb;
alter table public.bookings add column if not exists restrictions_bypass boolean not null default false;
alter table public.bookings add column if not exists custom_discount_rupees integer not null default 0;
alter table public.bookings add column if not exists outstanding_fines_rupees integer not null default 0;

-- ---------------------------------------------------------------------------
-- fleet_inventory_units: physical units (catalog remains in vehicles)
-- ---------------------------------------------------------------------------
create table if not exists public.fleet_inventory_units (
  id uuid primary key default gen_random_uuid(),
  vehicle_model_id uuid not null references public.vehicles (id) on delete restrict,
  registration_number text,
  vin text,
  internal_unit_code text,
  gps_tracker_id text,
  gps_status text not null default 'unknown',
  fuel_level_pct numeric(5, 2),
  availability_status text not null default 'available',
  maintenance_status text not null default 'ok',
  fleet_ops_note text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fleet_inventory_units_registration_unique unique (registration_number),
  constraint fleet_inventory_units_internal_code_unique unique (internal_unit_code)
);

create index if not exists fleet_inventory_units_model_idx
  on public.fleet_inventory_units (vehicle_model_id)
  where deleted_at is null;

comment on table public.fleet_inventory_units is 'Physical fleet units; vehicles row is the catalog model.';
comment on column public.fleet_inventory_units.vehicle_model_id is 'FK to public.vehicles catalog/model row.';

-- Backfill one unit per catalog vehicle missing registration (non-destructive)
insert into public.fleet_inventory_units (vehicle_model_id, registration_number, internal_unit_code)
select
  v.id,
  nullif(trim(v.registration_number), ''),
  'UNIT-' || upper(substring(replace(v.id::text, '-', '') from 1 for 8))
from public.vehicles v
where v.deleted_at is null
  and not exists (
    select 1 from public.fleet_inventory_units u
    where u.vehicle_model_id = v.id and u.deleted_at is null
  );

alter table public.fleet_inventory_units enable row level security;

drop policy if exists "fleet_inventory_units_staff_read" on public.fleet_inventory_units;
create policy "fleet_inventory_units_staff_read" on public.fleet_inventory_units
  for select to authenticated
  using (public.is_admin_staff());

drop policy if exists "fleet_inventory_units_staff_write" on public.fleet_inventory_units;
create policy "fleet_inventory_units_staff_write" on public.fleet_inventory_units
  for all to authenticated
  using (public.is_admin_staff())
  with check (public.is_admin_staff());
