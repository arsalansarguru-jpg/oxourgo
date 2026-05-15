-- Soft-delete, archive metadata, recovery snapshots, and KYC storage safety.

-- ---------------------------------------------------------------------------
-- Shared archive columns (operational entities)
-- ---------------------------------------------------------------------------
alter table public.vehicles
  add column if not exists deleted_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users (id) on delete set null;

alter table public.booking_violations
  add column if not exists deleted_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users (id) on delete set null;

alter table public.bookings
  add column if not exists deleted_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users (id) on delete set null;

alter table public.kyc_documents
  add column if not exists deleted_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users (id) on delete set null,
  add column if not exists storage_retention_until timestamptz,
  add column if not exists storage_pinned boolean not null default false,
  add column if not exists recovery_metadata jsonb not null default '{}'::jsonb;

comment on column public.kyc_documents.storage_retention_until is 'Do not purge storage before this timestamp (compliance retention).';
comment on column public.kyc_documents.storage_pinned is 'When true, storage objects must not be removed by automated cleanup.';
comment on column public.kyc_documents.recovery_metadata is 'Backup path, checksum, last verified — for disaster recovery.';

-- Legacy cars catalog (if present in project)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'cars'
  ) then
    alter table public.cars
      add column if not exists deleted_at timestamptz,
      add column if not exists archived_at timestamptz,
      add column if not exists archived_by uuid references auth.users (id) on delete set null;
  end if;
end $$;

create index if not exists vehicles_deleted_at_idx on public.vehicles (deleted_at) where deleted_at is not null;
create index if not exists booking_violations_deleted_at_idx on public.booking_violations (deleted_at) where deleted_at is not null;
create index if not exists bookings_deleted_at_idx on public.bookings (deleted_at) where deleted_at is not null;
create index if not exists kyc_documents_deleted_at_idx on public.kyc_documents (deleted_at) where deleted_at is not null;

-- ---------------------------------------------------------------------------
-- Deleted entity snapshots (recovery history)
-- ---------------------------------------------------------------------------
create table if not exists public.deleted_entity_snapshots (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  snapshot jsonb not null,
  deleted_at timestamptz not null default now(),
  deleted_by uuid references auth.users (id) on delete set null,
  restored_at timestamptz,
  restored_by uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists deleted_entity_snapshots_entity_idx
  on public.deleted_entity_snapshots (entity_type, entity_id, deleted_at desc);

create index if not exists deleted_entity_snapshots_pending_restore_idx
  on public.deleted_entity_snapshots (restored_at)
  where restored_at is null;

comment on table public.deleted_entity_snapshots is 'Point-in-time JSON snapshots when staff soft-delete records; used for restore workflows.';

revoke all on public.deleted_entity_snapshots from anon, authenticated;
grant select, insert, update on public.deleted_entity_snapshots to service_role;

-- ---------------------------------------------------------------------------
-- Operational backup run log (admin visibility)
-- ---------------------------------------------------------------------------
create table if not exists public.backup_operation_logs (
  id uuid primary key default gen_random_uuid(),
  operation_type text not null,
  status text not null default 'completed',
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  performed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists backup_operation_logs_created_idx
  on public.backup_operation_logs (created_at desc);

comment on table public.backup_operation_logs is 'Manual export / recovery operations for admin backup dashboard.';

revoke all on public.backup_operation_logs from anon, authenticated;
grant select, insert on public.backup_operation_logs to service_role;

-- ---------------------------------------------------------------------------
-- Discourage hard DELETE on protected tables (service role can still bypass via migration)
-- ---------------------------------------------------------------------------
create or replace function public.block_operational_hard_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Permanent delete is disabled for %. Use archive/soft-delete from admin recovery tools.', TG_TABLE_NAME
    using errcode = 'P0001';
end;
$$;

drop trigger if exists trg_vehicles_block_hard_delete on public.vehicles;
create trigger trg_vehicles_block_hard_delete
  before delete on public.vehicles
  for each row execute function public.block_operational_hard_delete();

drop trigger if exists trg_booking_violations_block_hard_delete on public.booking_violations;
create trigger trg_booking_violations_block_hard_delete
  before delete on public.booking_violations
  for each row execute function public.block_operational_hard_delete();

-- KYC: customer rollback may remove failed inserts; admin uses archive columns instead of DELETE.
