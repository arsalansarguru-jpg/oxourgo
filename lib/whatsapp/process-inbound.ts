import 'server-only'

import { writeAuditLog } from '@/lib/audit/write'
import { AUDIT_ENTITY_TYPES } from '@/lib/audit/actions'
import { upsertCustomerContactByPhone } from '@/lib/whatsapp/contacts'
import { appendWhatsAppConversationMessage, getOrCreateWhatsAppConversation } from '@/lib/whatsapp/conversations'
import { deliverWhatsAppReply } from '@/lib/whatsapp/outbound'
import { runWhatsAppAssistantTurn } from '@/lib/whatsapp/assistant/registry'
import type { WhatsAppInboundEvent } from '@/lib/whatsapp/assistant/types'
import { captureRouteException } from '@/lib/monitoring/capture-route-exception'

export type ProcessInboundResult = {
  ok: boolean
  conversationId?: string
  replyText?: string
  sent?: boolean
  error?: string
}

/**
 * Persist inbound message, run AI concierge + flow engine, deliver outbound via Meta Cloud API.
 */
export async function processWhatsAppInbound(event: WhatsAppInboundEvent): Promise<ProcessInboundResult> {
  try {
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

    const inboundLogged = await appendWhatsAppConversationMessage({
      conversationId: conversation.id,
      direction: 'inbound',
      body: event.text,
      providerMessageId: event.messageId,
      idempotencyKey: event.messageId ? `in:${event.messageId}` : null,
      payload: { timestamp: event.timestamp },
    })

    if (!inboundLogged.ok) {
      return { ok: false, error: 'Duplicate or failed inbound log.' }
    }

    void writeAuditLog({
      entityType: AUDIT_ENTITY_TYPES.whatsapp,
      entityId: conversation.id,
      action: 'whatsapp.message_inbound',
      metadata: {
        messageId: event.messageId,
        contactId: contact.id,
        e164: event.fromE164,
      },
    })

    const turn = await runWhatsAppAssistantTurn({
      conversation,
      contact,
      inbound: event,
    })

    if (!turn.replyText?.trim()) {
      return { ok: true, conversationId: conversation.id }
    }

    const outboundKey = event.messageId ? `out:${event.messageId}` : `out:${Date.now()}`
    const delivery = await deliverWhatsAppReply({
      conversationId: conversation.id,
      toE164: event.fromE164,
      body: turn.replyText,
      idempotencyKey: outboundKey,
      payload: {
        assistant: true,
        handler: 'ai-concierge',
        nextFlowState: turn.nextFlowState ?? null,
      },
    })

    if (delivery.ok) {
      void writeAuditLog({
        entityType: AUDIT_ENTITY_TYPES.whatsapp,
        entityId: conversation.id,
        action: 'whatsapp.message_outbound',
        metadata: {
          providerMessageId: delivery.providerMessageId,
          sent: delivery.sent,
        },
      })
    }

    return {
      ok: true,
      conversationId: conversation.id,
      replyText: turn.replyText,
      sent: delivery.ok ? delivery.sent : false,
      error: delivery.ok ? undefined : delivery.message,
    }
  } catch (e) {
    captureRouteException('notifications', 'processWhatsAppInbound', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Processing failed.' }
  }
}
