import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'

export const dynamic = 'force-dynamic'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Organization preferences, integrations, and operator defaults will be configurable here."
      />
      <AdminCard>
        <AdminCardContent className="py-12 text-center">
          <p className="text-sm leading-relaxed text-muted">
            Advanced configuration controls are not exposed yet. Use deployment environment and server logs for
            infrastructure changes.
          </p>
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}
