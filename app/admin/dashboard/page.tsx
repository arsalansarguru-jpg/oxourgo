import { AdminDashboardOverview } from '@/components/admin/dashboard/admin-dashboard-overview'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { fetchDashboardOverviewBundle } from '@/lib/admin/data/dashboard-overview'
import { adminPageMetadata } from '@/lib/admin/page-metadata'
import { requireAdminPageAccess } from '@/lib/auth/guards'
import { isStaffRole } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export const metadata = adminPageMetadata('Dashboard')

export default async function AdminDashboardPage() {
  const summary = await requireAdminPageAccess('/admin/dashboard')
  if (!isStaffRole(summary.appRole)) {
    return null
  }

  const data = await fetchDashboardOverviewBundle(summary.appRole)

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHeader
        title="Dashboard overview"
        description="Enterprise command center — live KPIs, revenue analytics, fleet utilization, and operational queues for Oxour Go."
        eyebrow="Operations HQ"
      />
      <AdminDashboardOverview data={data} />
    </div>
  )
}
