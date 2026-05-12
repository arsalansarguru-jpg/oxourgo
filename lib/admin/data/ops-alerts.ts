import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export type OpsAlertListItem = {
  id: string
  type: string
  title: string
  body: string | null
  metadata: Record<string, unknown>
  created_at: string
  dismissed: boolean
}

export async function listOpsAlertsForAdmin(adminUserId: string, limit = 60): Promise<OpsAlertListItem[]> {
  const admin = createAdminClient()
  const { data: alerts, error } = await admin.from('ops_alerts').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error || !alerts?.length) return []

  const { data: dismissals } = await admin.from('ops_alert_dismissals').select('alert_id').eq('admin_user_id', adminUserId)
  const dismissed = new Set((dismissals ?? []).map((d) => d.alert_id))

  return alerts.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    body: a.body,
    metadata: (a.metadata as Record<string, unknown>) ?? {},
    created_at: a.created_at,
    dismissed: dismissed.has(a.id),
  }))
}

export async function countUndismissedOpsAlerts(adminUserId: string): Promise<number> {
  const rows = await listOpsAlertsForAdmin(adminUserId, 200)
  return rows.filter((r) => !r.dismissed).length
}
