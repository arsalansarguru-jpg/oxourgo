-- Admin operations: fleet imagery, customer ops fields, KYC audit, bookings notes, audit log, fleet storage.

-- ---------------------------------------------------------------------------
-- cars: imagery (public bucket `fleet`; uploads via service role / admin actions)
-- ---------------------------------------------------------------------------
alter table public.cars add column if not exists cover_image_path text;
alter table public.cars add column if not exists gallery_paths text[] not null default '{}'::text[];

comment on column public.cars.cover_image_path is 'Storage object path inside bucket `fleet` (e.g. {car_id}/cover.webp).';
comment on column public.cars.gallery_paths is 'Additional `fleet` bucket paths for gallery thumbnails.';

-- ---------------------------------------------------------------------------
-- profiles: admin notes + risk (editable in admin; risk can mirror heuristics)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists admin_notes text;
alter table public.profiles add column if not exists risk_score smallint not null default 0
  check (risk_score >= 0 and risk_score <= 100);

-- ---------------------------------------------------------------------------
-- bookings: operator-facing note (reject reason, internal memo)
-- ---------------------------------------------------------------------------
alter table public.bookings add column if not exists ops_note text;

-- ---------------------------------------------------------------------------
-- kyc_documents: audit who reviewed and when
-- ---------------------------------------------------------------------------
alter table public.kyc_documents add column if not exists reviewed_at timestamptz;
alter table public.kyc_documents add column if not exists reviewed_by uuid references auth.users (id) on delete set null;

-- ---------------------------------------------------------------------------
-- admin_audit_events (append-only; written from trusted server using service role)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_events_created_idx on public.admin_audit_events (created_at desc);
create index if not exists admin_audit_events_entity_idx on public.admin_audit_events (entity_type, entity_id);

alter table public.admin_audit_events enable row level security;

drop policy if exists "admin_audit_no_client_access" on public.admin_audit_events;
create policy "admin_audit_no_client_access" on public.admin_audit_events for all to authenticated using (false)
with check (false);

comment on table public.admin_audit_events is 'Admin action log; inserts via service role after JWT role validation in app code.';

-- ---------------------------------------------------------------------------
-- Storage: fleet images (public read; no direct authenticated writes — use admin/service upload)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fleet', 'fleet', true)
on conflict (id) do nothing;

drop policy if exists "fleet_objects_public_read" on storage.objects;
create policy "fleet_objects_public_read" on storage.objects for select to public using (bucket_id = 'fleet');
