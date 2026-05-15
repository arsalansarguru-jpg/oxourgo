-- WhatsApp operations architecture: shared bookings DB, conversation tracking,
-- customer contacts (E.164), booking_source channel attribution.
-- No separate calendar — availability remains database-driven overlap RPCs.

-- ---------------------------------------------------------------------------
-- customer_contacts — canonical phone identity for WhatsApp / ops
-- ---------------------------------------------------------------------------
create table if not exists public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  e164 text not null,
  user_id uuid references auth.users (id) on delete set null,
  full_name text,
  email text,
  whatsapp_opt_in boolean not null default true,
  preferred_channel text not null default 'whatsapp'
    check (preferred_channel in ('whatsapp', 'email', 'phone', 'website')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_contacts_e164_unique unique (e164),
  constraint customer_contacts_e164_format_chk check (e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create index if not exists customer_contacts_user_id_idx on public.customer_contacts (user_id)
where user_id is not null;

comment on table public.customer_contacts is 'Ops/WhatsApp contact identity; links to auth.users when customer has an account.';

-- ---------------------------------------------------------------------------
-- whatsapp_conversations — state machine + context for assistant flows
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_contact_id uuid not null references public.customer_contacts (id) on delete restrict,
  external_wa_id text,
  status text not null default 'active'
    check (status in ('active', 'paused', 'closed', 'archived')),
  flow_state text not null default 'inquiry'
    check (
      flow_state in (
        'inquiry',
        'collecting_dates',
        'checking_availability',
        'suggesting_vehicle',
        'creating_booking',
        'awaiting_kyc',
        'payment_workflow',
        'awaiting_admin_confirmation',
        'confirmed',
        'closed'
      )
    ),
  context jsonb not null default '{}'::jsonb,
  active_booking_id uuid,
  assigned_ops_user_id uuid references auth.users (id) on delete set null,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_conversations_external_wa_id_unique unique (external_wa_id)
);

create index if not exists whatsapp_conversations_contact_idx
  on public.whatsapp_conversations (customer_contact_id, updated_at desc);

create index if not exists whatsapp_conversations_flow_state_idx
  on public.whatsapp_conversations (flow_state, status)
where status = 'active';

comment on table public.whatsapp_conversations is 'WhatsApp thread state; context holds draft dates, vehicle hints, etc. for future AI agents.';

-- ---------------------------------------------------------------------------
-- whatsapp_conversation_messages — append-only message log (ops audit)
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.whatsapp_conversations (id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound', 'system')),
  message_type text not null default 'text'
    check (message_type in ('text', 'template', 'interactive', 'media', 'system')),
  body text,
  payload jsonb not null default '{}'::jsonb,
  provider_message_id text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  constraint whatsapp_conversation_messages_idempotency_unique unique (idempotency_key)
);

create index if not exists whatsapp_conversation_messages_conv_idx
  on public.whatsapp_conversation_messages (conversation_id, created_at desc);

-- ---------------------------------------------------------------------------
-- bookings — channel attribution + contact / conversation linkage
-- ---------------------------------------------------------------------------
alter table public.bookings add column if not exists booking_source text not null default 'website';

alter table public.bookings drop constraint if exists bookings_booking_source_check;
alter table public.bookings
  add constraint bookings_booking_source_check check (
    booking_source in ('website', 'whatsapp', 'admin_manual')
  );

alter table public.bookings add column if not exists customer_contact_id uuid references public.customer_contacts (id) on delete set null;

alter table public.bookings add column if not exists whatsapp_conversation_id uuid references public.whatsapp_conversations (id) on delete set null;

create index if not exists bookings_booking_source_idx on public.bookings (booking_source, created_at desc);

create index if not exists bookings_whatsapp_conversation_idx on public.bookings (whatsapp_conversation_id)
where whatsapp_conversation_id is not null;

comment on column public.bookings.booking_source is 'Channel: website (default), whatsapp, admin_manual.';
comment on column public.bookings.customer_contact_id is 'WhatsApp/ops phone identity when booking originated off-web.';
comment on column public.bookings.whatsapp_conversation_id is 'Originating WhatsApp thread when applicable.';

alter table public.whatsapp_conversations
  add constraint whatsapp_conversations_active_booking_id_fkey foreign key (active_booking_id) references public.bookings (id) on delete set null;

-- Backfill: existing rows without explicit source remain website (column default).

-- ---------------------------------------------------------------------------
-- outbound_jobs — reserve whatsapp channel for future dispatch
-- ---------------------------------------------------------------------------
alter table public.outbound_jobs drop constraint if exists outbound_jobs_channel_check;
alter table public.outbound_jobs
  add constraint outbound_jobs_channel_check check (channel in ('email', 'whatsapp'));

-- ---------------------------------------------------------------------------
-- updated_at triggers (conversations + contacts)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at_timestamp ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customer_contacts_set_updated_at on public.customer_contacts;
create trigger customer_contacts_set_updated_at
before update on public.customer_contacts
for each row
execute function public.set_updated_at_timestamp ();

drop trigger if exists whatsapp_conversations_set_updated_at on public.whatsapp_conversations;
create trigger whatsapp_conversations_set_updated_at
before update on public.whatsapp_conversations
for each row
execute function public.set_updated_at_timestamp ();

-- ---------------------------------------------------------------------------
-- RLS — staff read; service role writes from trusted workers
-- ---------------------------------------------------------------------------
alter table public.customer_contacts enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_conversation_messages enable row level security;

drop policy if exists "customer_contacts_select_staff" on public.customer_contacts;
create policy "customer_contacts_select_staff" on public.customer_contacts for select to authenticated using (public.is_ops_staff ());

drop policy if exists "customer_contacts_insert_staff" on public.customer_contacts;
create policy "customer_contacts_insert_staff" on public.customer_contacts for insert to authenticated with check (public.is_ops_staff ());

drop policy if exists "customer_contacts_update_staff" on public.customer_contacts;
create policy "customer_contacts_update_staff" on public.customer_contacts for update to authenticated using (public.is_ops_staff ())
with check (public.is_ops_staff ());

drop policy if exists "whatsapp_conversations_select_staff" on public.whatsapp_conversations;
create policy "whatsapp_conversations_select_staff" on public.whatsapp_conversations for select to authenticated using (public.is_ops_staff ());

drop policy if exists "whatsapp_conversations_insert_staff" on public.whatsapp_conversations;
create policy "whatsapp_conversations_insert_staff" on public.whatsapp_conversations for insert to authenticated with check (public.is_ops_staff ());

drop policy if exists "whatsapp_conversations_update_staff" on public.whatsapp_conversations;
create policy "whatsapp_conversations_update_staff" on public.whatsapp_conversations for update to authenticated using (public.is_ops_staff ())
with check (public.is_ops_staff ());

drop policy if exists "whatsapp_conversation_messages_select_staff" on public.whatsapp_conversation_messages;
create policy "whatsapp_conversation_messages_select_staff" on public.whatsapp_conversation_messages for select to authenticated using (public.is_ops_staff ());

drop policy if exists "whatsapp_conversation_messages_insert_staff" on public.whatsapp_conversation_messages;
create policy "whatsapp_conversation_messages_insert_staff" on public.whatsapp_conversation_messages for insert to authenticated with check (public.is_ops_staff ());

revoke all on public.customer_contacts from anon;
revoke all on public.whatsapp_conversations from anon;
revoke all on public.whatsapp_conversation_messages from anon;

grant select, insert, update on public.customer_contacts to authenticated;
grant select, insert, update on public.whatsapp_conversations to authenticated;
grant select, insert on public.whatsapp_conversation_messages to authenticated;

grant all on public.customer_contacts to service_role;
grant all on public.whatsapp_conversations to service_role;
grant all on public.whatsapp_conversation_messages to service_role;
