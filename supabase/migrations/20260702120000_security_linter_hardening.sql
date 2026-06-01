-- Supabase database linter remediation (security warnings).
-- Auth leaked-password protection: enable in Dashboard → Authentication → Providers → Email.

-- ---------------------------------------------------------------------------
-- 0011: Immutable search_path on trigger / helper functions
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at ()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_updated_at_timestamp ()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.block_operational_hard_delete ()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Permanent delete is disabled for %. Use archive/soft-delete from admin recovery tools.', TG_TABLE_NAME
    using errcode = 'P0001';
end;
$$;

-- Overlap RPCs: alter in place (prod may use different arg names, e.g. vehicle_uuid).
alter function public.has_vehicle_booking_overlap (uuid, timestamptz, timestamptz, uuid)
  set search_path = public;

alter function public.has_booking_overlap (uuid, timestamptz, timestamptz, uuid)
  set search_path = public;

-- ---------------------------------------------------------------------------
-- 0028 / 0029: RPC and trigger functions — not callable via PostgREST
-- ---------------------------------------------------------------------------
revoke all on function public.audit_log_booking_change () from public, anon, authenticated;
revoke all on function public.prevent_audit_log_mutation () from public, anon, authenticated;
revoke all on function public.handle_new_user_profile () from public, anon, authenticated;
revoke all on function public.block_operational_hard_delete () from public, anon, authenticated;
revoke all on function public.set_updated_at () from public, anon, authenticated;
revoke all on function public.set_updated_at_timestamp () from public, anon, authenticated;

revoke all on function public.claim_outbound_jobs_batch (int) from public, anon, authenticated;
grant execute on function public.claim_outbound_jobs_batch (int) to service_role;

revoke all on function public.has_booking_overlap (uuid, timestamptz, timestamptz, uuid) from public, anon, authenticated;
grant execute on function public.has_booking_overlap (uuid, timestamptz, timestamptz, uuid) to service_role;

revoke all on function public.has_vehicle_booking_overlap (uuid, timestamptz, timestamptz, uuid) from public, anon, authenticated;
grant execute on function public.has_vehicle_booking_overlap (uuid, timestamptz, timestamptz, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 0024: Bookings INSERT — own row only (drop permissive dashboard policy if present)
-- ---------------------------------------------------------------------------
drop policy if exists "Users can create bookings" on public.bookings;

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert
  to authenticated
  with check (auth.uid () = user_id);

-- ---------------------------------------------------------------------------
-- 0025: Public buckets — drop broad SELECT (public URLs still work; no bucket listing)
-- ---------------------------------------------------------------------------
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "fleet_objects_public_read" on storage.objects;

-- ---------------------------------------------------------------------------
-- 0014: Extensions out of public schema (idempotent)
-- ---------------------------------------------------------------------------
create schema if not exists extensions;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'citext') then
    execute 'alter extension citext set schema extensions';
  else
    execute 'create extension if not exists citext with schema extensions';
  end if;

  if exists (select 1 from pg_extension where extname = 'btree_gist') then
    execute 'alter extension btree_gist set schema extensions';
  else
    execute 'create extension if not exists btree_gist with schema extensions';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Security definer view: vehicle_compliance_alerts → security invoker + service_role only
-- (App uses service role on vehicles; view kept for SQL/cron convenience.)
-- ---------------------------------------------------------------------------
drop view if exists public.vehicle_compliance_alerts;

create view public.vehicle_compliance_alerts
with (security_invoker = true)
as
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

comment on view public.vehicle_compliance_alerts is
  'Vehicles with insurance, PUC, or RC expiring within 30 days — admin dashboard alerts.';

revoke all on public.vehicle_compliance_alerts from public, anon, authenticated;
grant select on public.vehicle_compliance_alerts to service_role;
