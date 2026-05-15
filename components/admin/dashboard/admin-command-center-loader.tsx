import { AdminCommandCenter } from '@/components/admin/dashboard/admin-command-center'
import { fetchCommandCenterBundle } from '@/lib/admin/data/command-center'
import { getAuthSessionSummary } from '@/lib/auth/server'
import type { AppAuthRole } from '@/lib/auth/roles'

export async function AdminCommandCenterLoader() {
  const summary = await getAuthSessionSummary()
  const role: AppAuthRole = summary?.appRole ?? 'support_agent'

  const data = await fetchCommandCenterBundle(role)
  return <AdminCommandCenter data={data} />
}
