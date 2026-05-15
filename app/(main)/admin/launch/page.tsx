import { AdminLaunchControlCenter } from '@/components/admin/launch/admin-launch-control-center'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { fetchLaunchReadinessBundle } from '@/lib/admin/data/launch-readiness'
import { requireAdminPageAccess } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export default async function AdminLaunchPage() {
  const summary = await requireAdminPageAccess('/admin/launch')
  const bundle = await fetchLaunchReadinessBundle(summary.user.id)
  const canWrite = hasPermission(summary.appRole, 'admin.launch.write')

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHeader
        eyebrow="Go-live"
        title="Launch control center"
        description="Production readiness checklist, deployment visibility, operational alerts, and final QA sign-off — operations admin only."
      />
      <AdminLaunchControlCenter bundle={bundle} canWrite={canWrite} />
    </div>
  )
}
