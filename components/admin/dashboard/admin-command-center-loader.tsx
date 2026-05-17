import { OpsCommandCenter } from '@/components/admin/dashboard/ops-command-center'
import { fetchOpsDashboardBundle } from '@/lib/admin/data/ops-dashboard'
import { getAuthSessionSummary } from '@/lib/auth/server'
import type { AppAuthRole } from '@/lib/auth/roles'

export async function AdminCommandCenterLoader() {
  const summary = await getAuthSessionSummary()
  const role: AppAuthRole = summary?.appRole ?? 'support_agent'

  const data = await fetchOpsDashboardBundle(role)
  return <OpsCommandCenter data={data} />
}
