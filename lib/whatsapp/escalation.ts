import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'
import { writeAuditLog } from '@/lib/audit/write'
import { AUDIT_ENTITY_TYPES } from '@/lib/audit/actions'

export type EscalateWhatsAppConversationInput = {
  conversationId: string
  reason: string
  triggeredBy?: 'ai' | 'customer' | 'ops'
  customerMessage?: string | null
}

export async function escalateWhatsAppConversation(
  input: EscalateWhatsAppConversationInput,
): Promise<{ ok: boolean }> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const patch = {
    status: 'paused',
    escalated_at: now,
    escalation_reason: input.reason.slice(0, 500),
    ai_enabled: false,
    updated_at: now,
  }
  const { error } = await admin.from('whatsapp_conversations').update(patch).eq('id', input.conversationId)

  if (error) {
    logPostgrestError('[escalateWhatsAppConversation]', error)
    return { ok: false }
  }

  void writeAuditLog({
    entityType: AUDIT_ENTITY_TYPES.whatsapp,
    entityId: input.conversationId,
    action: 'whatsapp.escalated',
    metadata: {
      reason: input.reason,
      triggeredBy: input.triggeredBy ?? 'ai',
      customerMessage: input.customerMessage ?? null,
    },
  })

  return { ok: true }
}

export function isConversationEscalated(conversation: {
  escalated_at?: string | null
  status?: string | null
}): boolean {
  return Boolean(conversation.escalated_at) || conversation.status === 'paused'
}
