-- Production-safe bootstrap for customer KYC schema.
-- Run in Supabase SQL Editor when `public.kyc_documents` is missing or repair migrations failed.
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- profiles (ensure user_id PK + KYC lifecycle columns)
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

-- Legacy installs used `id` instead of `user_id`
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
  )
  and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'user_id'
  ) then
    alter table public.profiles rename column id to user_id;
  end if;
end $$;

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists verification_tier text not null default 'basic';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists kyc_status text not null default 'not_started';
alter table public.profiles add column if not exists kyc_submitted_at timestamptz;
alter table public.profiles add column if not exists kyc_approved_at timestamptz;
alter table public.profiles add column if not exists admin_notes text;
alter table public.profiles add column if not exists risk_score integer not null default 0;

alter table public.profiles drop constraint if exists profiles_kyc_status_check;
alter table public.profiles
  add constraint profiles_kyc_status_check check (
    kyc_status in (
      'not_started',
      'pending',
      'approved',
      'rejected',
      'resubmission_required'
    )
  );

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- kyc_documents (metadata; files in storage bucket `kyc`)
-- ---------------------------------------------------------------------------
create table if not exists public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  status text not null default 'pending',
  reviewer_note text,
  rejection_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  byte_size bigint,
  content_type text,
  original_filename text,
  deleted_at timestamptz,
  archived_at timestamptz,
  archived_by uuid references auth.users (id) on delete set null,
  storage_retention_until timestamptz,
  storage_pinned boolean not null default false,
  recovery_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kyc_documents add column if not exists rejection_reason text;
alter table public.kyc_documents add column if not exists reviewed_at timestamptz;
alter table public.kyc_documents add column if not exists reviewed_by uuid references auth.users (id) on delete set null;
alter table public.kyc_documents add column if not exists byte_size bigint;
alter table public.kyc_documents add column if not exists content_type text;
alter table public.kyc_documents add column if not exists original_filename text;
alter table public.kyc_documents add column if not exists deleted_at timestamptz;
alter table public.kyc_documents add column if not exists archived_at timestamptz;
alter table public.kyc_documents add column if not exists archived_by uuid references auth.users (id) on delete set null;
alter table public.kyc_documents add column if not exists storage_retention_until timestamptz;
alter table public.kyc_documents add column if not exists storage_pinned boolean not null default false;
alter table public.kyc_documents add column if not exists recovery_metadata jsonb not null default '{}'::jsonb;

alter table public.kyc_documents drop constraint if exists kyc_documents_document_type_check;
alter table public.kyc_documents
  add constraint kyc_documents_document_type_check check (
    document_type in ('aadhaar', 'license', 'passport', 'selfie', 'pan')
  );

alter table public.kyc_documents drop constraint if exists kyc_documents_status_check;
alter table public.kyc_documents
  add constraint kyc_documents_status_check check (
    status in (
      'pending',
      'reviewing',
      'approved',
      'rejected',
      'resubmission_required'
    )
  );

create index if not exists kyc_documents_user_idx on public.kyc_documents (user_id, created_at desc);
create index if not exists kyc_documents_deleted_at_idx on public.kyc_documents (deleted_at) where deleted_at is not null;

alter table public.kyc_documents enable row level security;

drop policy if exists "kyc_select_own" on public.kyc_documents;
create policy "kyc_select_own" on public.kyc_documents for select to authenticated using (auth.uid() = user_id);

drop policy if exists "kyc_insert_own" on public.kyc_documents;
create policy "kyc_insert_own" on public.kyc_documents for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "kyc_delete_own" on public.kyc_documents;
create policy "kyc_delete_own" on public.kyc_documents for delete to authenticated using (
  auth.uid() = user_id
  and status in ('pending', 'reviewing')
);

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_kyc_staff'
  ) then
    execute $policy$
      drop policy if exists "kyc_select_staff" on public.kyc_documents;
      create policy "kyc_select_staff" on public.kyc_documents for select to authenticated using (
        public.is_kyc_staff () or public.is_admin_staff ()
      );
      drop policy if exists "kyc_update_staff" on public.kyc_documents;
      create policy "kyc_update_staff" on public.kyc_documents for update to authenticated using (public.is_kyc_staff ())
      with check (public.is_kyc_staff ());
    $policy$;
  elsif exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_ops_staff'
  ) then
    execute $policy$
      drop policy if exists "kyc_select_staff" on public.kyc_documents;
      create policy "kyc_select_staff" on public.kyc_documents for select to authenticated using (public.is_ops_staff ());
      drop policy if exists "kyc_update_staff" on public.kyc_documents;
      create policy "kyc_update_staff" on public.kyc_documents for update to authenticated using (public.is_ops_staff ())
      with check (public.is_ops_staff ());
    $policy$;
  end if;
end $$;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.kyc_documents to authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket `kyc` (private; path prefix = auth uid)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kyc',
  'kyc',
  false,
  8388608,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = coalesce(storage.buckets.file_size_limit, excluded.file_size_limit),
  allowed_mime_types = coalesce(storage.buckets.allowed_mime_types, excluded.allowed_mime_types);

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
)
with check (
  bucket_id = 'kyc'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "kyc_objects_delete_own" on storage.objects;
create policy "kyc_objects_delete_own" on storage.objects for delete to authenticated using (
  bucket_id = 'kyc'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Backfill profiles.kyc_* only when kyc_documents exists (avoids failure on partial runs)
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'kyc_documents'
  ) then
    update public.profiles p
    set
      kyc_status = case
        when p.verification_tier = 'verified' then 'approved'
        when exists (select 1 from public.kyc_documents k where k.user_id = p.user_id and k.deleted_at is null) then 'pending'
        else coalesce(nullif(p.kyc_status, ''), 'not_started')
      end,
      kyc_submitted_at = coalesce(
        p.kyc_submitted_at,
        (select min(k.created_at) from public.kyc_documents k where k.user_id = p.user_id and k.deleted_at is null)
      )
    where p.kyc_status = 'not_started' or p.kyc_submitted_at is null;
  end if;
end $$;
