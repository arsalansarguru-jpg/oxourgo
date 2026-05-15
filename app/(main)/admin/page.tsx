import { Suspense } from 'react'

import { AdminCommandCenterLoader } from '@/components/admin/dashboard/admin-command-center-loader'
import { AdminCommandCenterSkeleton } from '@/components/admin/dashboard/admin-command-center-skeleton'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

export const dynamic = 'force-dynamic'

export default function AdminHomePage() {
  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHeader
        title="Command center"
        description="Real-time operational HQ — live fleet load, finance pulse, queues, and audit activity across Oxour Go."
        eyebrow="Operations HQ"
      />
      <Suspense fallback={<AdminCommandCenterSkeleton />}>
        <AdminCommandCenterLoader />
      </Suspense>
    </div>
  )
}
