-- In-app notifications (customers) + ops alert feed (admins). Inserts via service role from app server.

-- ---------------------------------------------------------------------------
-- Customer notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (
    type in (
      'booking_received',
      'booking_approved',
      'booking_rejected',
      'booking_cancelled',
      'kyc_submitted',
      'kyc_approved',
      'kyc_rejected',
      'payment_pending',
      'payment_updated',
      'trip_reminder'
    )
  )
);

create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select to authenticated using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update to authenticated using (auth.uid() = user_id)
with check (auth.uid() = user_id);

comment on table public.notifications is 'Customer in-app notifications; inserts from trusted server (service role) only.';

-- ---------------------------------------------------------------------------
-- Ops alerts (admin console; no authenticated direct SQL access)
-- ---------------------------------------------------------------------------
create table if not exists public.ops_alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ops_alerts_created_idx on public.ops_alerts (created_at desc);

create table if not exists public.ops_alert_dismissals (
  alert_id uuid not null references public.ops_alerts (id) on delete cascade,
  admin_user_id uuid not null references auth.users (id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (alert_id, admin_user_id)
);

revoke all on public.ops_alerts from anon, authenticated;
revoke all on public.ops_alert_dismissals from anon, authenticated;
grant select, insert, update, delete on public.ops_alerts to service_role;
grant select, insert, update, delete on public.ops_alert_dismissals to service_role;

comment on table public.ops_alerts is 'Operations feed; read/write only via service role in app code after JWT role checks.';

-- Enable Realtime for `notifications` in Supabase Dashboard → Database → Replication, or:
--   alter publication supabase_realtime add table public.notifications;
