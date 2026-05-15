-- Production audit log: immutable append-only trail for operational, payment, KYC, fleet, and admin events.

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_role text,
  entity_type text not null,
  entity_id text,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is 'Immutable operational audit trail; inserts via service role only.';
comment on column public.audit_logs.actor_id is 'Staff or system user who performed the action; null for automated events.';
comment on column public.audit_logs.actor_role is 'Application RBAC role at time of action (oxour_role).';
comment on column public.audit_logs.old_value is 'Prior state snapshot for change events.';
comment on column public.audit_logs.new_value is 'Resulting state snapshot for change events.';
comment on column public.audit_logs.metadata is 'Context: booking_id, user_id, reason, amounts, etc.';

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action, created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_metadata_user_idx on public.audit_logs ((metadata ->> 'userId'), created_at desc)
  where metadata ? 'userId';
create index if not exists audit_logs_metadata_booking_idx on public.audit_logs ((metadata ->> 'bookingId'), created_at desc)
  where metadata ? 'bookingId';

-- Immutability: block UPDATE and DELETE at the database level.
create or replace function public.prevent_audit_log_mutation ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  raise exception 'audit_logs are immutable';
end;
$$;

drop trigger if exists audit_logs_no_update on public.audit_logs;
create trigger audit_logs_no_update
  before update on public.audit_logs
  for each row
  execute function public.prevent_audit_log_mutation ();

drop trigger if exists audit_logs_no_delete on public.audit_logs;
create trigger audit_logs_no_delete
  before delete on public.audit_logs
  for each row
  execute function public.prevent_audit_log_mutation ();

-- ---------------------------------------------------------------------------
-- RLS: no client writes; ops admins may SELECT (defense in depth; app uses service role)
-- ---------------------------------------------------------------------------
alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_no_client_write" on public.audit_logs;
create policy "audit_logs_no_client_write" on public.audit_logs
  for insert to authenticated
  with check (false);

drop policy if exists "audit_logs_no_client_update" on public.audit_logs;
create policy "audit_logs_no_client_update" on public.audit_logs
  for update to authenticated
  using (false)
  with check (false);

drop policy if exists "audit_logs_no_client_delete" on public.audit_logs;
create policy "audit_logs_no_client_delete" on public.audit_logs
  for delete to authenticated
  using (false);

drop policy if exists "audit_logs_ops_read" on public.audit_logs;
create policy "audit_logs_ops_read" on public.audit_logs
  for select to authenticated
  using (public.is_ops_staff ());
