import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'
import type { Database } from '@/lib/supabase/database.types'
import type { WhatsAppConversationContext, WhatsAppFlowState } from '@/lib/whatsapp/types'

export type WhatsAppConversationRow = Database['public']['Tables']['whatsapp_conversations']['Row']

export async function getOrCreateWhatsAppConversation(input: {
  customerContactId: string
  externalWaId?: string | null
}): Promise<{ conversation: WhatsAppConversationRow | null; error: string | null }> {
  const admin = createAdminClient()

  if (input.externalWaId?.trim()) {
    const { data: byWa, error: waErr } = await admin
      .from('whatsapp_conversations')
      .select('*')
      .eq('external_wa_id', input.externalWaId.trim())
      .maybeSingle()

    if (waErr) {
      logPostgrestError('[getOrCreateWhatsAppConversation] byWa', waErr)
      return { conversation: null, error: 'Could not load conversation.' }
    }
    if (byWa) return { conversation: byWa, error: null }
  }

  const { data: active, error: activeErr } = await admin
    .from('whatsapp_conversations')
    .select('*')
    .eq('customer_contact_id', input.customerContactId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeErr) {
    logPostgrestError('[getOrCreateWhatsAppConversation] active', activeErr)
    return { conversation: null, error: 'Could not load conversation.' }
  }
  if (active) return { conversation: active, error: null }

  const insert: Database['public']['Tables']['whatsapp_conversations']['Insert'] = {
    customer_contact_id: input.customerContactId,
    external_wa_id: input.externalWaId?.trim() || null,
    status: 'active',
    flow_state: 'inquiry',
    context: {},
  }

  const { data: created, error: insErr } = await admin
    .from('whatsapp_conversations')
    .insert(insert)
    .select('*')
    .single()

  if (insErr) {
    logPostgrestError('[getOrCreateWhatsAppConversation] insert', insErr)
    return { conversation: null, error: 'Could not start conversation.' }
  }
  return { conversation: created, error: null }
}

export async function updateWhatsAppConversationState(input: {
  conversationId: string
  flowState?: WhatsAppFlowState
  contextPatch?: Partial<WhatsAppConversationContext>
  activeBookingId?: string | null
  status?: Database['public']['Tables']['whatsapp_conversations']['Row']['status']
}): Promise<{ ok: boolean; message: string }> {
  const admin = createAdminClient()

  const { data: current, error: loadErr } = await admin
    .from('whatsapp_conversations')
    .select('context')
    .eq('id', input.conversationId)
    .maybeSingle()

  if (loadErr) {
    logPostgrestError('[updateWhatsAppConversationState] load', loadErr)
    return { ok: false, message: 'Could not load conversation.' }
  }
  if (!current) {
    return { ok: false, message: 'Conversation not found.' }
  }

  const prevContext = (current.context ?? {}) as WhatsAppConversationContext
  const nextContext = input.contextPatch ? { ...prevContext, ...input.contextPatch } : prevContext

  const patch: Database['public']['Tables']['whatsapp_conversations']['Update'] = {
    context: nextContext as Database['public']['Tables']['whatsapp_conversations']['Update']['context'],
  }
  if (input.flowState) patch.flow_state = input.flowState
  if (input.activeBookingId !== undefined) patch.active_booking_id = input.activeBookingId
  if (input.status) patch.status = input.status

  const { error } = await admin.from('whatsapp_conversations').update(patch).eq('id', input.conversationId)

  if (error) {
    logPostgrestError('[updateWhatsAppConversationState]', error)
    return { ok: false, message: 'Could not update conversation.' }
  }
  return { ok: true, message: 'Conversation updated.' }
}

export async function appendWhatsAppConversationMessage(input: {
  conversationId: string
  direction: 'inbound' | 'outbound' | 'system'
  body?: string | null
  messageType?: 'text' | 'template' | 'interactive' | 'media' | 'system'
  payload?: Record<string, unknown>
  providerMessageId?: string | null
  idempotencyKey?: string | null
}): Promise<{ ok: boolean }> {
  const admin = createAdminClient()

  const row: Database['public']['Tables']['whatsapp_conversation_messages']['Insert'] = {
    conversation_id: input.conversationId,
    direction: input.direction,
    message_type: input.messageType ?? 'text',
    body: input.body ?? null,
    payload: (input.payload ?? {}) as Database['public']['Tables']['whatsapp_conversation_messages']['Insert']['payload'],
    provider_message_id: input.providerMessageId ?? null,
    idempotency_key: input.idempotencyKey ?? null,
  }

  const { error } = await admin.from('whatsapp_conversation_messages').insert(row)

  if (error) {
    if (error.code === '23505' && input.idempotencyKey) {
      return { ok: true }
    }
    logPostgrestError('[appendWhatsAppConversationMessage]', error)
    return { ok: false }
  }

  const tsPatch =
    input.direction === 'inbound'
      ? { last_inbound_at: new Date().toISOString() }
      : input.direction === 'outbound'
        ? { last_outbound_at: new Date().toISOString() }
        : {}

  if (Object.keys(tsPatch).length) {
    await admin.from('whatsapp_conversations').update(tsPatch).eq('id', input.conversationId)
  }

  return { ok: true }
}
