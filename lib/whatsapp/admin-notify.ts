import 'server-only'

import { notifyOps } from '@/lib/notifications/emit'
import { writeAuditLog } from '@/lib/audit/write'
import { AUDIT_ENTITY_TYPES } from '@/lib/audit/actions'

export async function notifyOpsWhatsAppEscalation(input: {
  conversationId: string
  contactE164: string
  reason: string
  lastMessage?: string | null
}): Promise<void> {
  await notifyOps({
    type: 'whatsapp_escalation',
    title: 'WhatsApp needs human follow-up',
    body: `${input.contactE164}: ${input.reason}${input.lastMessage ? ` — "${input.lastMessage.slice(0, 120)}"` : ''}`,
    metadata: {
      conversation_id: input.conversationId,
      e164: input.contactE164,
    },
  })

  void writeAuditLog({
    entityType: AUDIT_ENTITY_TYPES.whatsapp,
    entityId: input.conversationId,
    action: 'whatsapp.ops_notified',
    metadata: { reason: input.reason },
  })
}

export async function notifyOpsWhatsAppBookingCreated(input: {
  conversationId: string
  bookingId: string
  contactE164: string
  totalRupees: number
}): Promise<void> {
  await notifyOps({
    type: 'whatsapp_booking_created',
    title: 'New WhatsApp booking',
    body: `${input.contactE164} · ₹${input.totalRupees.toLocaleString('en-IN')} · review in admin`,
    metadata: {
      conversation_id: input.conversationId,
      booking_id: input.bookingId,
    },
  })
}
