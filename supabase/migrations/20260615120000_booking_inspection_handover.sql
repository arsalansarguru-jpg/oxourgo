-- Vehicle handover / return inspection: booking columns, photo metadata, event timeline,
-- private storage bucket `booking_inspection` (path: bookings/{booking_id}/...).

-- ---------------------------------------------------------------------------
-- bookings: readings, condition notes, penalties, signature, inspection gates
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists pickup_fuel_level smallint
    check (pickup_fuel_level is null or (pickup_fuel_level >= 0 and pickup_fuel_level <= 100));

alter table public.bookings
  add column if not exists return_fuel_level smallint
    check (return_fuel_level is null or (return_fuel_level >= 0 and return_fuel_level <= 100));

alter table public.bookings add column if not exists pickup_odometer_km integer
  check (pickup_odometer_km is null or pickup_odometer_km >= 0);

alter table public.bookings add column if not exists return_odometer_km integer
  check (return_odometer_km is null or return_odometer_km >= 0);

alter table public.bookings
  add column if not exists pickup_condition_notes jsonb not null default '{}'::jsonb;

alter table public.bookings
  add column if not exists return_condition_notes jsonb not null default '{}'::jsonb;

alter table public.bookings
  add column if not exists penalty_damage_rupees integer not null default 0
    check (penalty_damage_rupees >= 0);

alter table public.bookings
  add column if not exists penalty_late_rupees integer not null default 0
    check (penalty_late_rupees >= 0);

alter table public.bookings
  add column if not exists penalty_extra_km_rupees integer not null default 0
    check (penalty_extra_km_rupees >= 0);

alter table public.bookings
  add column if not exists deposit_penalty_total_rupees integer not null default 0
    check (deposit_penalty_total_rupees >= 0);

alter table public.bookings add column if not exists customer_handover_signature_path text;

alter table public.bookings add column if not exists customer_handover_signed_at timestamptz;

alter table public.bookings add column if not exists pickup_inspection_completed_at timestamptz;

alter table public.bookings add column if not exists return_inspection_completed_at timestamptz;

comment on column public.bookings.pickup_fuel_level is 'Fuel gauge at pickup as percent 0–100.';
comment on column public.bookings.return_fuel_level is 'Fuel gauge at return as percent 0–100.';
comment on column public.bookings.pickup_condition_notes is 'JSON keys: scratches, dents, fuelNote, cleanliness.';
comment on column public.bookings.return_condition_notes is 'JSON keys: scratches, dents, fuelNote, cleanliness.';
comment on column public.bookings.deposit_penalty_total_rupees is 'Amount taken or held from deposit toward penalties.';

-- ---------------------------------------------------------------------------
-- booking_inspection_photos
-- ---------------------------------------------------------------------------
create table if not exists public.booking_inspection_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  phase text not null check (phase in ('pickup', 'return')),
  slot text not null check (slot in ('front', 'rear', 'left', 'right', 'interior', 'other')),
  storage_path text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  unique (booking_id, phase, slot)
);

create index if not exists booking_inspection_photos_booking_idx on public.booking_inspection_photos (booking_id, phase);

alter table public.booking_inspection_photos enable row level security;

drop policy if exists "booking_inspection_photos_select_own_or_staff" on public.booking_inspection_photos;
create policy "booking_inspection_photos_select_own_or_staff" on public.booking_inspection_photos for select to authenticated using (
  public.is_ops_staff ()
  or exists (
    select 1
    from public.bookings b
    where b.id = booking_inspection_photos.booking_id
      and b.user_id = auth.uid ()
  )
);

drop policy if exists "booking_inspection_photos_insert_staff" on public.booking_inspection_photos;
create policy "booking_inspection_photos_insert_staff" on public.booking_inspection_photos for insert to authenticated with check (public.is_ops_staff ());

drop policy if exists "booking_inspection_photos_update_staff" on public.booking_inspection_photos;
create policy "booking_inspection_photos_update_staff" on public.booking_inspection_photos for update to authenticated using (public.is_ops_staff ())
with check (public.is_ops_staff ());

drop policy if exists "booking_inspection_photos_delete_staff" on public.booking_inspection_photos;
create policy "booking_inspection_photos_delete_staff" on public.booking_inspection_photos for delete to authenticated using (public.is_ops_staff ());

-- ---------------------------------------------------------------------------
-- booking_inspection_events (admin timeline; staff read/write only)
-- ---------------------------------------------------------------------------
create table if not exists public.booking_inspection_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists booking_inspection_events_booking_idx on public.booking_inspection_events (booking_id, created_at desc);

alter table public.booking_inspection_events enable row level security;

drop policy if exists "booking_inspection_events_select_staff" on public.booking_inspection_events;
create policy "booking_inspection_events_select_staff" on public.booking_inspection_events for select to authenticated using (public.is_ops_staff ());

drop policy if exists "booking_inspection_events_insert_staff" on public.booking_inspection_events;
create policy "booking_inspection_events_insert_staff" on public.booking_inspection_events for insert to authenticated with check (public.is_ops_staff ());

-- Append-only from app perspective; allow delete only staff for corrections
drop policy if exists "booking_inspection_events_delete_staff" on public.booking_inspection_events;
create policy "booking_inspection_events_delete_staff" on public.booking_inspection_events for delete to authenticated using (public.is_ops_staff ());

-- ---------------------------------------------------------------------------
-- Storage bucket (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('booking_inspection', 'booking_inspection', false)
on conflict (id) do nothing;

-- Path: bookings/{booking_id}/{phase}/{filename}
drop policy if exists "booking_inspection_objects_select_staff" on storage.objects;
create policy "booking_inspection_objects_select_staff" on storage.objects for select to authenticated using (
  bucket_id = 'booking_inspection'
  and public.is_ops_staff ()
);

drop policy if exists "booking_inspection_objects_select_own_booking" on storage.objects;
create policy "booking_inspection_objects_select_own_booking" on storage.objects for select to authenticated using (
  bucket_id = 'booking_inspection'
  and split_part(name, '/', 1) = 'bookings'
  and exists (
    select 1
    from public.bookings b
    where b.id::text = split_part(name, '/', 2)
      and b.user_id = auth.uid ()
  )
);

drop policy if exists "booking_inspection_objects_insert_staff" on storage.objects;
create policy "booking_inspection_objects_insert_staff" on storage.objects for insert to authenticated with check (
  bucket_id = 'booking_inspection'
  and public.is_ops_staff ()
  and split_part(name, '/', 1) = 'bookings'
);

drop policy if exists "booking_inspection_objects_update_staff" on storage.objects;
create policy "booking_inspection_objects_update_staff" on storage.objects for update to authenticated using (
  bucket_id = 'booking_inspection'
  and public.is_ops_staff ()
)
with check (
  bucket_id = 'booking_inspection'
  and public.is_ops_staff ()
);

drop policy if exists "booking_inspection_objects_delete_staff" on storage.objects;
create policy "booking_inspection_objects_delete_staff" on storage.objects for delete to authenticated using (
  bucket_id = 'booking_inspection'
  and public.is_ops_staff ()
);
