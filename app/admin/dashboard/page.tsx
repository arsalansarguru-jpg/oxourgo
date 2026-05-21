import { Suspense } from 'react'

import { AdminCommandCenterLoader } from '@/components/admin/dashboard/admin-command-center-loader'
import { AdminCommandCenterSkeleton } from '@/components/admin/dashboard/admin-command-center-skeleton'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { requireAdminPageAccess } from '@/lib/auth/guards'
import { isStaffRole } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const summary = await requireAdminPageAccess('/admin/dashboard')
  if (!isStaffRole(summary.appRole)) {
    return null
  }
  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHeader
        title="Dashboard overview"
        description="Enterprise command center — live KPIs, revenue analytics, fleet utilization, and operational queues for Oxour Go."
        eyebrow="Operations HQ"
      />
      <Suspense fallback={<AdminCommandCenterSkeleton />}>
        <AdminCommandCenterLoader />
      </Suspense>
    </div>
  )
}
