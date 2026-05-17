-- Repair KYC upload pipeline: bucket, storage RLS, table columns, and grants.
-- Safe to re-run in production (idempotent).

-- ---------------------------------------------------------------------------
-- Storage bucket `kyc` (private; only bucket used for customer KYC uploads)
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

-- ---------------------------------------------------------------------------
-- kyc_documents: ensure columns + constraints expected by the app
-- ---------------------------------------------------------------------------
alter table public.kyc_documents add column if not exists byte_size bigint;
alter table public.kyc_documents add column if not exists content_type text;
alter table public.kyc_documents add column if not exists original_filename text;
alter table public.kyc_documents add column if not exists reviewed_at timestamptz;
alter table public.kyc_documents add column if not exists reviewed_by uuid references auth.users (id) on delete set null;
alter table public.kyc_documents add column if not exists rejection_reason text;
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

-- ---------------------------------------------------------------------------
-- profiles: KYC lifecycle columns + constraint
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists kyc_status text not null default 'not_started';
alter table public.profiles add column if not exists kyc_submitted_at timestamptz;
alter table public.profiles add column if not exists kyc_approved_at timestamptz;

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

-- ---------------------------------------------------------------------------
-- Table grants (defense in depth if privileges were revoked)
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.kyc_documents to authenticated;
grant select, insert, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- kyc_documents RLS (customer own-row + staff read/update)
-- ---------------------------------------------------------------------------
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

-- Staff policies (only when RBAC helpers exist)
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
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- storage.objects: private `kyc` bucket — customer path prefix = auth.uid()
-- ---------------------------------------------------------------------------
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

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_kyc_staff'
  ) then
    execute $policy$
      drop policy if exists "kyc_objects_select_staff" on storage.objects;
      create policy "kyc_objects_select_staff" on storage.objects for select to authenticated using (
        bucket_id = 'kyc'
        and (public.is_kyc_staff () or public.is_ops_staff ())
      );
    $policy$;
  end if;
end $$;
