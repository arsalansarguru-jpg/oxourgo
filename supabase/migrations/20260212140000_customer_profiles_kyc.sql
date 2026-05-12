-- Customer profiles, KYC metadata, storage buckets for dashboard.
-- Apply in Supabase SQL editor after bookings migration.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  preferences jsonb not null default '{}'::jsonb,
  verification_tier text not null default 'basic'
    check (verification_tier in ('none', 'basic', 'verified')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_new_user_profile ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, phone)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile ();

-- ---------------------------------------------------------------------------
-- kyc_documents (metadata; files live in storage bucket `kyc`)
-- ---------------------------------------------------------------------------
create table if not exists public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_type text not null check (document_type in ('aadhaar', 'license', 'passport')),
  storage_path text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'approved', 'rejected')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kyc_documents_user_idx on public.kyc_documents (user_id, created_at desc);

alter table public.kyc_documents enable row level security;

drop policy if exists "kyc_select_own" on public.kyc_documents;
create policy "kyc_select_own" on public.kyc_documents for select to authenticated using (auth.uid() = user_id);

drop policy if exists "kyc_insert_own" on public.kyc_documents;
create policy "kyc_insert_own" on public.kyc_documents for insert to authenticated with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- payment_events (ledger lines; optional — UI also reads from bookings)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  title text not null,
  amount_rupees bigint not null,
  direction text not null check (direction in ('charge', 'credit', 'deposit_hold', 'deposit_release')),
  status text not null default 'posted' check (status in ('pending', 'posted', 'void')),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_user_idx on public.payment_events (user_id, created_at desc);

alter table public.payment_events enable row level security;

drop policy if exists "payment_events_select_own" on public.payment_events;
create policy "payment_events_select_own" on public.payment_events for select to authenticated using (auth.uid() = user_id);

drop policy if exists "payment_events_insert_own" on public.payment_events;
create policy "payment_events_insert_own" on public.payment_events for insert to authenticated with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('kyc', 'kyc', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- KYC objects: first path segment = auth uid
drop policy if exists "kyc_objects_select_own" on storage.objects;
create policy "kyc_objects_select_own" on storage.objects for select to authenticated using (
  bucket_id = 'kyc'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "kyc_objects_insert_own" on storage.objects;
create policy "kyc_objects_insert_own" on storage.objects for insert to authenticated with check (
  bucket_id = 'kyc'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "kyc_objects_update_own" on storage.objects;
create policy "kyc_objects_update_own" on storage.objects for update to authenticated using (
  bucket_id = 'kyc'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "kyc_objects_delete_own" on storage.objects;
create policy "kyc_objects_delete_own" on storage.objects for delete to authenticated using (
  bucket_id = 'kyc'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Avatars: public read; write only own folder
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select to public using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects for insert to authenticated with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects for update to authenticated using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects for delete to authenticated using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);
