import { AdminDashboardOverview } from '@/components/admin/dashboard/admin-dashboard-overview'
import { fetchDashboardOverviewBundle } from '@/lib/admin/data/dashboard-overview'
import { getAuthSessionSummary } from '@/lib/auth/server'
import type { AppAuthRole } from '@/lib/auth/roles'

export async function AdminCommandCenterLoader() {
  const summary = await getAuthSessionSummary()
  const role: AppAuthRole = summary?.appRole ?? 'support_agent'

  const data = await fetchDashboardOverviewBundle(role)
  return <AdminDashboardOverview data={data} />
}
