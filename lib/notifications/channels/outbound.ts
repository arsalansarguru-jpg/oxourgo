import type { NotificationTypeId } from '@/lib/notifications/types'

/**
 * Reserved for WhatsApp / email / SMS workers. Does not insert fake rows.
 * Future: write to an outbox table or call provider APIs from a background worker.
 */
export type OutboundChannel = 'whatsapp' | 'email'

export type OutboundEnqueueInput = {
  userId: string
  channels: OutboundChannel[]
  templateKey: NotificationTypeId | string
  payload: Record<string, unknown>
}

export async function enqueueOutbound(input: OutboundEnqueueInput): Promise<{ ok: true; skipped: true }> {
  void input
  return { ok: true, skipped: true }
}
