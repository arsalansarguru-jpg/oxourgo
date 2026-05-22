-- Operational hardening: profile normalization, support messaging, deposit backfill, fleet uniqueness.

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

  insert into public.profiles (user_id, full_name, display_name, phone)
  values (new.id, v_full, coalesce(v_display, v_full), v_phone)
  on conflict (user_id) do update
  set
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    phone = coalesce(public.profiles.phone, excluded.phone),
    updated_at = now()
  where public.profiles.full_name is null
     or public.profiles.display_name is null
     or public.profiles.phone is null;

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
