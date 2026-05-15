import 'server-only'

import { upsertCustomerContactByPhone } from '@/lib/whatsapp/contacts'
import { appendWhatsAppConversationMessage, getOrCreateWhatsAppConversation } from '@/lib/whatsapp/conversations'
import { runWhatsAppAssistantTurn } from '@/lib/whatsapp/assistant/registry'
import type { WhatsAppInboundEvent } from '@/lib/whatsapp/assistant/types'

export type ProcessInboundResult = {
  ok: boolean
  conversationId?: string
  replyText?: string
  error?: string
}

/**
 * Persist inbound message, run assistant registry (stub handlers today).
 * Does not call WhatsApp send API — outbound remains ops/manual until provider wired.
 */
export async function processWhatsAppInbound(event: WhatsAppInboundEvent): Promise<ProcessInboundResult> {
  const { contact, error: contactErr } = await upsertCustomerContactByPhone({ phone: event.fromE164 })
  if (!contact || contactErr) {
    return { ok: false, error: contactErr ?? 'Contact error' }
  }

  const { conversation, error: convErr } = await getOrCreateWhatsAppConversation({
    customerContactId: contact.id,
    externalWaId: event.externalWaId,
  })
  if (!conversation || convErr) {
    return { ok: false, error: convErr ?? 'Conversation error' }
  }

  await appendWhatsAppConversationMessage({
    conversationId: conversation.id,
    direction: 'inbound',
    body: event.text,
    providerMessageId: event.messageId,
    idempotencyKey: event.messageId ? `in:${event.messageId}` : null,
    payload: { timestamp: event.timestamp },
  })

  const turn = await runWhatsAppAssistantTurn({
    conversation,
    contact,
    inbound: event,
  })

  if (turn.replyText) {
    await appendWhatsAppConversationMessage({
      conversationId: conversation.id,
      direction: 'outbound',
      body: turn.replyText,
      messageType: 'system',
      payload: { assistant: true, stub: true },
    })
  }

  return {
    ok: true,
    conversationId: conversation.id,
    replyText: turn.replyText,
  }
}
