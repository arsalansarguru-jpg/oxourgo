-- Outbound email / messaging queue (service role only). Claim batch via RPC for cron workers.

-- ---------------------------------------------------------------------------
-- outbound_jobs
-- ---------------------------------------------------------------------------
create table if not exists public.outbound_jobs (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'email',
  template_key text not null,
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  to_email text,
  to_e164 text,
  status text not null default 'pending',
  attempts int not null default 0,
  next_run_at timestamptz not null default now(),
  last_error text,
  correlation_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outbound_jobs_channel_check check (channel in ('email')),
  constraint outbound_jobs_status_check check (
    status in ('pending', 'processing', 'sent', 'failed', 'dead')
  ),
  constraint outbound_jobs_idempotency_key_unique unique (idempotency_key)
);

create index if not exists outbound_jobs_status_next_idx
  on public.outbound_jobs (status, next_run_at asc, created_at asc);

comment on table public.outbound_jobs is 'Queued outbound communications; insert + process only via service role from trusted app/cron.';

revoke all on public.outbound_jobs from anon, authenticated;
grant select, insert, update, delete on public.outbound_jobs to service_role;

-- Atomically claim a batch of due jobs (SKIP LOCKED avoids cron overlap stalls).
create or replace function public.claim_outbound_jobs_batch(p_batch_size int default 25)
returns setof public.outbound_jobs
language sql
security definer
set search_path = public
as $$
  with picked as (
    select id
    from public.outbound_jobs
    where status = 'pending'
      and next_run_at <= now()
    order by next_run_at asc, created_at asc
    limit greatest(1, least(p_batch_size, 100))
    for update skip locked
  )
  update public.outbound_jobs o
  set
    status = 'processing',
    updated_at = now()
  from picked p
  where o.id = p.id
  returning o.*;
$$;

comment on function public.claim_outbound_jobs_batch(int) is 'Cron worker: locks and returns up to p_batch_size due outbound_jobs rows.';

revoke all on function public.claim_outbound_jobs_batch(int) from public;
grant execute on function public.claim_outbound_jobs_batch(int) to service_role;

-- ---------------------------------------------------------------------------
-- Customer notification types: return reminder + invoice sent
-- ---------------------------------------------------------------------------
alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (
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
      'trip_reminder',
      'return_reminder',
      'trip_started',
      'trip_completed',
      'invoice_sent'
    )
  );
