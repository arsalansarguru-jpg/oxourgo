-- Enterprise admin operations: fleet compliance, maintenance, damage, support tickets, invoices.

-- ---------------------------------------------------------------------------
-- Fleet compliance & telemetry (extends public.vehicles)
-- ---------------------------------------------------------------------------
alter table public.vehicles
  add column if not exists model text,
  add column if not exists chassis_number text,
  add column if not exists vehicle_location text,
  add column if not exists odometer_km integer check (odometer_km is null or odometer_km >= 0),
  add column if not exists insurance_expiry date,
  add column if not exists puc_expiry date,
  add column if not exists rc_expiry date,
  add column if not exists rc_storage_path text,
  add column if not exists insurance_storage_path text,
  add column if not exists puc_storage_path text,
  add column if not exists fastag_id text,
  add column if not exists gps_tracker_id text,
  add column if not exists gps_status text default 'unknown'
    check (gps_status is null or gps_status in ('online', 'offline', 'unknown', 'disabled')),
  add column if not exists fuel_level_pct smallint check (fuel_level_pct is null or (fuel_level_pct >= 0 and fuel_level_pct <= 100)),
  add column if not exists last_gps_ping_at timestamptz;

comment on column public.vehicles.model is 'Model name when distinct from marketing `name`.';
comment on column public.vehicles.gps_status is 'Last known GPS/telematics connectivity for admin tracking.';

create index if not exists vehicles_compliance_expiry_idx on public.vehicles (insurance_expiry, puc_expiry, rc_expiry)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- vehicle_maintenance_logs
-- ---------------------------------------------------------------------------
create table if not exists public.vehicle_maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  maintenance_type text not null default 'scheduled'
    check (maintenance_type in ('scheduled', 'repair', 'service', 'inspection', 'tyre', 'other')),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  title text not null,
  description text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  odometer_km integer check (odometer_km is null or odometer_km >= 0),
  cost_rupees integer check (cost_rupees is null or cost_rupees >= 0),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicle_maintenance_logs_vehicle_idx on public.vehicle_maintenance_logs (vehicle_id, scheduled_at desc);
create index if not exists vehicle_maintenance_logs_status_idx on public.vehicle_maintenance_logs (status)
  where status in ('scheduled', 'in_progress');

alter table public.vehicle_maintenance_logs enable row level security;

drop policy if exists "vehicle_maintenance_logs_staff" on public.vehicle_maintenance_logs;
create policy "vehicle_maintenance_logs_staff" on public.vehicle_maintenance_logs for all to authenticated
  using (public.is_fleet_staff ())
  with check (public.is_fleet_staff ());

-- ---------------------------------------------------------------------------
-- damage_reports (post-trip / inspection damage workflow)
-- ---------------------------------------------------------------------------
create table if not exists public.damage_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete set null,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  user_id uuid,
  status text not null default 'reported'
    check (status in ('reported', 'under_inspection', 'approved', 'repaired', 'closed')),
  description text not null,
  estimated_cost_rupees integer not null default 0 check (estimated_cost_rupees >= 0),
  approved_cost_rupees integer check (approved_cost_rupees is null or approved_cost_rupees >= 0),
  customer_liable_rupees integer not null default 0 check (customer_liable_rupees >= 0),
  before_photo_paths text[] not null default '{}',
  after_photo_paths text[] not null default '{}',
  repair_notes text,
  reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists damage_reports_booking_idx on public.damage_reports (booking_id, created_at desc);
create index if not exists damage_reports_status_idx on public.damage_reports (status)
  where status not in ('closed', 'repaired');

alter table public.damage_reports enable row level security;

drop policy if exists "damage_reports_staff" on public.damage_reports;
create policy "damage_reports_staff" on public.damage_reports for all to authenticated
  using (public.is_ops_staff ())
  with check (public.is_ops_staff ());

drop policy if exists "damage_reports_customer_select_own" on public.damage_reports;
create policy "damage_reports_customer_select_own" on public.damage_reports for select to authenticated
  using (user_id = auth.uid ());

-- ---------------------------------------------------------------------------
-- support_tickets
-- ---------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  booking_id uuid references public.bookings (id) on delete set null,
  subject text not null,
  body text not null,
  category text not null default 'general'
    check (category in ('general', 'booking', 'payment', 'kyc', 'damage', 'refund', 'fleet', 'other')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  assigned_to uuid,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists support_tickets_status_idx on public.support_tickets (status, priority, created_at desc);
create index if not exists support_tickets_user_idx on public.support_tickets (user_id, created_at desc);

alter table public.support_tickets enable row level security;

drop policy if exists "support_tickets_staff" on public.support_tickets;
create policy "support_tickets_staff" on public.support_tickets for all to authenticated
  using (public.is_ops_staff ())
  with check (public.is_ops_staff ());

drop policy if exists "support_tickets_customer_own" on public.support_tickets;
create policy "support_tickets_customer_own" on public.support_tickets for select to authenticated
  using (user_id = auth.uid ());

drop policy if exists "support_tickets_customer_insert" on public.support_tickets;
create policy "support_tickets_customer_insert" on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid ());

-- ---------------------------------------------------------------------------
-- invoices (GST / rental invoices linked to bookings)
-- ---------------------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  user_id uuid not null,
  invoice_number text not null,
  invoice_type text not null default 'rental'
    check (invoice_type in ('rental', 'deposit', 'penalty', 'refund', 'gst')),
  subtotal_rupees integer not null default 0 check (subtotal_rupees >= 0),
  gst_rupees integer not null default 0 check (gst_rupees >= 0),
  total_rupees integer not null default 0 check (total_rupees >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'issued', 'paid', 'void')),
  issued_at timestamptz,
  pdf_storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invoice_number)
);

create index if not exists invoices_booking_idx on public.invoices (booking_id, created_at desc);
create index if not exists invoices_user_idx on public.invoices (user_id, created_at desc);

alter table public.invoices enable row level security;

drop policy if exists "invoices_staff" on public.invoices;
create policy "invoices_staff" on public.invoices for all to authenticated
  using (public.is_finance_staff () or public.is_ops_staff ())
  with check (public.is_finance_staff () or public.is_ops_staff ());

drop policy if exists "invoices_customer_select_own" on public.invoices;
create policy "invoices_customer_select_own" on public.invoices for select to authenticated
  using (user_id = auth.uid ());

-- ---------------------------------------------------------------------------
-- Compliance expiry alerts view (for cron / dashboard)
-- ---------------------------------------------------------------------------
create or replace view public.vehicle_compliance_alerts as
select
  v.id as vehicle_id,
  v.name,
  v.registration_number,
  case
    when v.insurance_expiry is not null and v.insurance_expiry <= (current_date + interval '30 days') then 'insurance'
    when v.puc_expiry is not null and v.puc_expiry <= (current_date + interval '30 days') then 'puc'
    when v.rc_expiry is not null and v.rc_expiry <= (current_date + interval '30 days') then 'rc'
  end as alert_type,
  least(
    v.insurance_expiry,
    v.puc_expiry,
    v.rc_expiry
  ) as earliest_expiry
from public.vehicles v
where v.deleted_at is null
  and (
    (v.insurance_expiry is not null and v.insurance_expiry <= (current_date + interval '30 days'))
    or (v.puc_expiry is not null and v.puc_expiry <= (current_date + interval '30 days'))
    or (v.rc_expiry is not null and v.rc_expiry <= (current_date + interval '30 days'))
  );

comment on view public.vehicle_compliance_alerts is 'Vehicles with insurance, PUC, or RC expiring within 30 days — admin dashboard alerts.';
