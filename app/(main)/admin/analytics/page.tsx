import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'

export const dynamic = 'force-dynamic'

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Intelligence"
        title="Analytics"
        description="Operational and revenue insights will appear here as your data pipelines connect."
      />
      <AdminCard>
        <AdminCardContent className="py-12 text-center">
          <p className="text-sm leading-relaxed text-muted">
            Charts, cohorts, and fleet utilization views are being prepared for this workspace.
          </p>
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}
