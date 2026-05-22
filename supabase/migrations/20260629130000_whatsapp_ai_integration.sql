-- WhatsApp AI integration: escalation tracking, turn metadata, outbound job idempotency.

alter table public.whatsapp_conversations
  add column if not exists escalated_at timestamptz,
  add column if not exists escalation_reason text,
  add column if not exists ai_enabled boolean not null default true,
  add column if not exists last_ai_turn_at timestamptz,
  add column if not exists last_ai_model text;

comment on column public.whatsapp_conversations.escalated_at is 'When set, AI replies pause until ops resumes the thread.';
comment on column public.whatsapp_conversations.ai_enabled is 'Ops can disable AI auto-replies per conversation.';

create index if not exists whatsapp_conversations_escalated_idx
  on public.whatsapp_conversations (escalated_at desc nulls last)
  where escalated_at is not null;

-- Prevent duplicate active bookings from the same WhatsApp thread (same vehicle + window).
create unique index if not exists bookings_whatsapp_active_dedupe_idx
  on public.bookings (whatsapp_conversation_id, vehicle_id, pickup_date, return_date)
  where deleted_at is null
    and booking_status not in ('cancelled')
    and whatsapp_conversation_id is not null;
