import 'server-only'

import { notifyOps } from '@/lib/notifications/emit'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

const SLA_HOURS = 48

/** Ensures ops_alerts exist for support chats open longer than the SLA window. */
export async function ensureSupportSlaOpsAlerts(): Promise<void> {
  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000).toISOString()

  const { data: breached, error } = await admin
    .from('support_conversations')
    .select('id, user_id, last_message_at, status')
    .eq('status', 'open')
    .lt('last_message_at', cutoff)
    .limit(50)

  if (error) {
    logPostgrestError('[ensureSupportSlaOpsAlerts] conversations', error)
    return
  }
  if (!breached?.length) return

  const { data: existing } = await admin.from('ops_alerts').select('id, metadata').eq('type', 'support_sla_breach')

  const existingConvIds = new Set<string>()
  for (const row of existing ?? []) {
    const id = (row.metadata as Record<string, unknown>)?.conversation_id
    if (typeof id === 'string') existingConvIds.add(id)
  }

  for (const c of breached) {
    const convId = c.id as string
    if (existingConvIds.has(convId)) continue

    const days = Math.floor((Date.now() - new Date(c.last_message_at as string).getTime()) / (1000 * 60 * 60 * 24))
    await notifyOps({
      type: 'support_sla_breach',
      title: `Support SLA breach · open ${days}d+`,
      body: 'A live chat thread has had no staff reply for over 48 hours. Review in Support → Live chat threads.',
      metadata: {
        conversation_id: convId,
        customer_user_id: c.user_id,
        last_message_at: c.last_message_at,
      },
    })
  }
}
