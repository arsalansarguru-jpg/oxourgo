-- Traffic fines & violation management: per-booking violations, timeline, private challan storage.

alter table public.bookings
  add column if not exists outstanding_fines_rupees integer not null default 0
    check (outstanding_fines_rupees >= 0);

comment on column public.bookings.outstanding_fines_rupees is
  'Sum of violation amounts still pending collection (pending, notified, disputed).';

-- ---------------------------------------------------------------------------
-- booking_violations
-- ---------------------------------------------------------------------------
create table if not exists public.booking_violations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  user_id uuid not null,
  violation_type text not null check (
    violation_type in (
      'traffic_challan',
      'speeding_fine',
      'toll_violation',
      'parking_penalty',
      'towing_charge',
      'damage_liability'
    )
  ),
  amount_rupees integer not null check (amount_rupees > 0 and amount_rupees <= 100000000),
  reason text not null,
  violation_date date not null,
  authority_source text,
  notes text,
  status text not null default 'pending' check (
    status in (
      'pending',
      'customer_notified',
      'paid',
      'deducted_from_deposit',
      'disputed'
    )
  ),
  challan_storage_path text,
  challan_mime text,
  challan_file_name text,
  amount_paid_rupees integer not null default 0 check (amount_paid_rupees >= 0),
  amount_deducted_rupees integer not null default 0 check (amount_deducted_rupees >= 0),
  customer_notified_at timestamptz,
  paid_at timestamptz,
  deducted_at timestamptz,
  resolved_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_violations_booking_idx on public.booking_violations (booking_id, created_at desc);
create index if not exists booking_violations_status_idx on public.booking_violations (status)
where status in ('pending', 'customer_notified', 'disputed');
create index if not exists booking_violations_user_idx on public.booking_violations (user_id, created_at desc);

alter table public.booking_violations enable row level security;

drop policy if exists "booking_violations_select_own_or_staff" on public.booking_violations;
create policy "booking_violations_select_own_or_staff" on public.booking_violations for select to authenticated using (
  public.is_ops_staff ()
  or user_id = auth.uid ()
);

drop policy if exists "booking_violations_insert_staff" on public.booking_violations;
create policy "booking_violations_insert_staff" on public.booking_violations for insert to authenticated with check (public.is_ops_staff ());

drop policy if exists "booking_violations_update_staff" on public.booking_violations;
create policy "booking_violations_update_staff" on public.booking_violations for update to authenticated using (public.is_ops_staff ())
with check (public.is_ops_staff ());

drop policy if exists "booking_violations_delete_staff" on public.booking_violations;
create policy "booking_violations_delete_staff" on public.booking_violations for delete to authenticated using (public.is_ops_staff ());

-- ---------------------------------------------------------------------------
-- booking_violation_events (timeline)
-- ---------------------------------------------------------------------------
create table if not exists public.booking_violation_events (
  id uuid primary key default gen_random_uuid(),
  violation_id uuid not null references public.booking_violations (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists booking_violation_events_violation_idx on public.booking_violation_events (violation_id, created_at desc);
create index if not exists booking_violation_events_booking_idx on public.booking_violation_events (booking_id, created_at desc);

alter table public.booking_violation_events enable row level security;

drop policy if exists "booking_violation_events_select_own_or_staff" on public.booking_violation_events;
create policy "booking_violation_events_select_own_or_staff" on public.booking_violation_events for select to authenticated using (
  public.is_ops_staff ()
  or exists (
    select 1
    from public.bookings b
    where b.id = booking_violation_events.booking_id
      and b.user_id = auth.uid ()
  )
);

drop policy if exists "booking_violation_events_insert_staff" on public.booking_violation_events;
create policy "booking_violation_events_insert_staff" on public.booking_violation_events for insert to authenticated with check (public.is_ops_staff ());

-- ---------------------------------------------------------------------------
-- Storage bucket for challan images/PDFs (private)
-- Path: bookings/{booking_id}/violations/{violation_id}/{filename}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('booking_violation_challans', 'booking_violation_challans', false)
on conflict (id) do nothing;

drop policy if exists "booking_violation_challans_select_staff" on storage.objects;
create policy "booking_violation_challans_select_staff" on storage.objects for select to authenticated using (
  bucket_id = 'booking_violation_challans'
  and public.is_ops_staff ()
);

drop policy if exists "booking_violation_challans_select_own_booking" on storage.objects;
create policy "booking_violation_challans_select_own_booking" on storage.objects for select to authenticated using (
  bucket_id = 'booking_violation_challans'
  and split_part(name, '/', 1) = 'bookings'
  and exists (
    select 1
    from public.bookings b
    where b.id::text = split_part(name, '/', 2)
      and b.user_id = auth.uid ()
  )
);

drop policy if exists "booking_violation_challans_insert_staff" on storage.objects;
create policy "booking_violation_challans_insert_staff" on storage.objects for insert to authenticated with check (
  bucket_id = 'booking_violation_challans'
  and public.is_ops_staff ()
  and split_part(name, '/', 1) = 'bookings'
);

drop policy if exists "booking_violation_challans_update_staff" on storage.objects;
create policy "booking_violation_challans_update_staff" on storage.objects for update to authenticated using (
  bucket_id = 'booking_violation_challans'
  and public.is_ops_staff ()
)
with check (
  bucket_id = 'booking_violation_challans'
  and public.is_ops_staff ()
);

drop policy if exists "booking_violation_challans_delete_staff" on storage.objects;
create policy "booking_violation_challans_delete_staff" on storage.objects for delete to authenticated using (
  bucket_id = 'booking_violation_challans'
  and public.is_ops_staff ()
);
