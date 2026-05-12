'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { requireAppRole } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listOpsAlertsForAdmin } from '@/lib/admin/data/ops-alerts'

export async function dismissOpsAlertAction(alertId: string): Promise<AdminActionResult> {
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
    return { ok: false, message: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/notifications')
  return { ok: true }
}

export async function getOpsAlertsSnippetAction(): Promise<{
  unread: number
  items: Awaited<ReturnType<typeof listOpsAlertsForAdmin>>
}> {
  const { user } = await requireAppRole('ops_admin')
  const items = await listOpsAlertsForAdmin(user.id, 12)
  const unread = items.filter((i) => !i.dismissed).length
  return { unread, items: items.filter((i) => !i.dismissed).slice(0, 6) }
}
