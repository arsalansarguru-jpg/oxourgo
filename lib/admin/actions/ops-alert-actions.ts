'use server'

import { revalidatePath } from 'next/cache'

import { captureServerPosthogEvent } from '@/lib/analytics/posthog-server'
import { POSTHOG_EVENTS } from '@/lib/analytics/posthog-events'
import type { AdminActionResult } from '@/lib/admin/actions/types'
import { requireAppRole } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminActionDbFailed } from '@/lib/errors/safe-user-message'
import { listOpsAlertsForAdmin } from '@/lib/admin/data/ops-alerts'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'

export async function dismissOpsAlertAction(alertId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('dismissOpsAlertAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const { error } = await admin.from('ops_alert_dismissals').insert({
      alert_id: alertId,
      admin_user_id: user.id,
    })

    if (error) {
      if (error.message.includes('duplicate') || error.code === '23505') {
        return { ok: true }
      }
      return adminActionDbFailed('dismissOpsAlertAction', error)
    }

    revalidatePath('/admin')
    revalidatePath('/admin/notifications')
    void captureServerPosthogEvent({
      distinctId: user.id,
      event: POSTHOG_EVENTS.adminOpsDismiss,
      properties: { alert_id: alertId },
    })
    return { ok: true }
  })
}

export async function getOpsAlertsSnippetAction(): Promise<{
  unread: number
  items: Awaited<ReturnType<typeof listOpsAlertsForAdmin>>
}> {
  return runInstrumentedServerAction('getOpsAlertsSnippetAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const items = await listOpsAlertsForAdmin(user.id, 12)
    const unread = items.filter((i) => !i.dismissed).length
    return { unread, items: items.filter((i) => !i.dismissed).slice(0, 6) }
  })
}
