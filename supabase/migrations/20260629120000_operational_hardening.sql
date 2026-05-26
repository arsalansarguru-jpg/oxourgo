-- Operational hardening: profile normalization, support messaging, deposit backfill, fleet uniqueness.
-- NOTE: payment_status is often payment_status_enum — never use trim(payment_status).
-- If profiles/support already applied, run: supabase/scripts/operational_hardening_resume.sql

-- ---------------------------------------------------------------------------
-- profiles: display_name + OAuth metadata backfill
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists display_name text;

create or replace function public.handle_new_user_profile ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
  v_full text;
  v_display text;
  v_phone text;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_full := nullif(trim(coalesce(
    meta->>'full_name',
    meta->>'name',
    meta->>'display_name',
    ''
  )), '');
  v_display := nullif(trim(coalesce(meta->>'display_name', meta->>'name', '')), '');
  v_phone := nullif(trim(coalesce(meta->>'phone', '')), '');

  -- Explicitly alias the target table as 'p' to ensure 100% compatible references
  insert into public.profiles as p (user_id, full_name, display_name, phone)
  values (new.id, v_full, coalesce(v_display, v_full), v_phone)
  on conflict (user_id) do update
  set
    full_name = coalesce(p.full_name, excluded.full_name),
    display_name = coalesce(p.display_name, excluded.display_name),
    phone = coalesce(p.phone, excluded.phone),
    updated_at = now()
  where p.full_name is null
     or p.display_name is null
     or p.phone is null;

  return new;
end;
$$;

-- Backfill existing profiles from auth.users metadata
update public.profiles p
set
  full_name = coalesce(
    nullif(trim(p.full_name), ''),
    nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', '')), ''),
    nullif(trim(coalesce(u.raw_user_meta_data->>'name', '')), ''),
    nullif(trim(coalesce(u.raw_user_meta_data->>'display_name', '')), '')
  ),
  display_name = coalesce(
    nullif(trim(p.display_name), ''),
    nullif(trim(coalesce(u.raw_user_meta_data->>'display_name', '')), ''),
    nullif(trim(coalesce(u.raw_user_meta_data->>'name', '')), ''),
    nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', '')), '')
  ),
  phone = coalesce(
    nullif(trim(p.phone), ''),
    nullif(trim(coalesce(u.raw_user_meta_data->>'phone', '')), ''),
    nullif(trim(coalesce(u.phone, '')), '')
  ),
  updated_at = now()
from auth.users u
where u.id = p.user_id
  and (
    p.full_name is null
    or trim(p.full_name) = ''
    or p.display_name is null
    or trim(p.display_name) = ''
    or p.phone is null
    or trim(p.phone) = ''
  );

-- ---------------------------------------------------------------------------
-- support_conversations + support_messages (real chat persistence)
-- ---------------------------------------------------------------------------
create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_conversations_user_idx
  on public.support_conversations (user_id, last_message_at desc);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations (id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'staff', 'system')),
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists support_messages_conversation_idx
  on public.support_messages (conversation_id, created_at asc);

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "support_conversations_customer" on public.support_conversations;
create policy "support_conversations_customer" on public.support_conversations
  for all to authenticated
  using (user_id = auth.uid ())
  with check (user_id = auth.uid ());

drop policy if exists "support_conversations_staff" on public.support_conversations;
create policy "support_conversations_staff" on public.support_conversations
  for all to authenticated
  using (public.is_ops_staff ())
  with check (public.is_ops_staff ());

drop policy if exists "support_messages_customer_select" on public.support_messages;
create policy "support_messages_customer_select" on public.support_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.support_conversations c
      where c.id = conversation_id and c.user_id = auth.uid ()
    )
  );

drop policy if exists "support_messages_customer_insert" on public.support_messages;
create policy "support_messages_customer_insert" on public.support_messages
  for insert to authenticated
  with check (
    sender_role = 'customer'
    and exists (
      select 1 from public.support_conversations c
      where c.id = conversation_id and c.user_id = auth.uid ()
    )
  );

drop policy if exists "support_messages_staff" on public.support_messages;
create policy "support_messages_staff" on public.support_messages
  for all to authenticated
  using (public.is_ops_staff ())
  with check (public.is_ops_staff ());

-- ---------------------------------------------------------------------------
-- bookings: ensure columns required by app + audit trigger (prior migrations may be missing)
-- ---------------------------------------------------------------------------
alter table public.bookings add column if not exists amount_paid bigint;
alter table public.bookings add column if not exists amount_due bigint;
alter table public.bookings add column if not exists deposit_held_rupees bigint;
alter table public.bookings add column if not exists deposit_amount integer;
alter table public.bookings add column if not exists deleted_at timestamptz;

-- payment_status is text or enum — never trim(); only backfill nulls.
update public.bookings
set payment_status = 'pending'
where payment_status is null;

update public.bookings
set
  amount_paid = coalesce(amount_paid, 0),
  amount_due = coalesce(amount_due, coalesce(total_rupees, 0))
where amount_paid is null
   or amount_due is null;

-- Audit trigger must not reference columns that are not on the row type — refresh after alters.
create or replace function public.audit_log_booking_change ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_action text;
  v_old jsonb;
  v_new jsonb;
  v_track_keys text[] := array[
    'booking_status',
    'payment_status',
    'total_rupees',
    'amount_paid',
    'amount_due',
    'deposit_amount',
    'deposit_held_rupees',
    'deleted_at'
  ];
begin
  if tg_op = 'INSERT' then
    v_action := 'booking.created';
    v_new := (
      select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(to_jsonb(new))
      where key = any (v_track_keys)
    );
    insert into public.audit_logs (actor_id, actor_role, entity_type, entity_id, action, new_value, metadata)
    values (
      new.user_id,
      'system',
      'booking',
      new.id::text,
      v_action,
      v_new,
      jsonb_build_object('bookingId', new.id, 'userId', new.user_id, 'source', 'db_trigger')
    );
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_old := (
      select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(to_jsonb(old))
      where key = any (v_track_keys)
    );
    v_new := (
      select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(to_jsonb(new))
      where key = any (v_track_keys)
    );

    if (v_new->>'deleted_at') is not null and (v_old->>'deleted_at') is null then
      v_action := 'booking.soft_deleted';
    elsif (v_old->>'booking_status') is distinct from (v_new->>'booking_status') then
      v_action := 'booking.status_changed';
    elsif (v_old->>'payment_status') is distinct from (v_new->>'payment_status') then
      v_action := 'booking.payment_status_changed';
    else
      v_action := 'booking.updated';
    end if;

    insert into public.audit_logs (actor_id, actor_role, entity_type, entity_id, action, old_value, new_value, metadata)
    values (
      coalesce(auth.uid(), new.user_id),
      'system',
      'booking',
      new.id::text,
      v_action,
      v_old,
      v_new,
      jsonb_build_object('bookingId', new.id, 'userId', new.user_id, 'source', 'db_trigger')
    );
    return new;
  end if;

  return coalesce(new, old);
end;
$$;

-- ---------------------------------------------------------------------------
-- bookings: backfill missing deposit_amount from vehicle catalog
-- ---------------------------------------------------------------------------
update public.bookings b
set
  deposit_amount = coalesce(
    nullif(b.deposit_amount, 0),
    nullif(b.deposit_held_rupees, 0),
    (
      select greatest(0, round(coalesce(v.security_deposit, 0)::numeric))
      from public.vehicles v
      where v.id = b.vehicle_id
    ),
    0
  ),
  deposit_held_rupees = coalesce(
    nullif(b.deposit_held_rupees, 0),
    nullif(b.deposit_amount, 0),
    (
      select greatest(0, round(coalesce(v.security_deposit, 0)::numeric))
      from public.vehicles v
      where v.id = b.vehicle_id
    ),
    0
  )
where b.deleted_at is null
  and b.booking_status not in ('cancelled')
  and coalesce(b.deposit_amount, 0) = 0
  and coalesce(b.deposit_held_rupees, 0) = 0
  and b.vehicle_id is not null;

-- ---------------------------------------------------------------------------
-- vehicles: telemetry + soft-delete columns for tracking UI
-- ---------------------------------------------------------------------------
alter table public.vehicles add column if not exists vehicle_location text;
alter table public.vehicles add column if not exists gps_status text default 'unknown';
alter table public.vehicles add column if not exists fuel_level_pct smallint;
alter table public.vehicles add column if not exists deleted_at timestamptz;

-- ---------------------------------------------------------------------------
-- vehicles: prevent duplicate registration numbers (non-empty)
-- ---------------------------------------------------------------------------
create unique index if not exists vehicles_registration_number_unique_idx
  on public.vehicles (lower(trim(registration_number)))
  where deleted_at is null
    and registration_number is not null
    and trim(registration_number) <> '';

-- ---------------------------------------------------------------------------
-- fleet telemetry placeholders for operational tracking UI
-- ---------------------------------------------------------------------------
update public.vehicles
set
  fuel_level_pct = coalesce(fuel_level_pct, 65 + (abs(hashtext(id::text)) % 30)),
  gps_status = coalesce(gps_status, 'offline'),
  vehicle_location = coalesce(nullif(trim(vehicle_location), ''), 'Mumbai — awaiting GPS ping')
where deleted_at is null
  and (fuel_level_pct is null or gps_status is null or vehicle_location is null or trim(vehicle_location) = '');
