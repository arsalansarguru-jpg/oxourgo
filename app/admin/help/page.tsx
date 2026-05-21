import { AdminHelpHub } from '@/components/admin/help-center/admin-help-hub'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { HELP_ARTICLES } from '@/lib/admin/help-center/articles'
import { filterArticlesForRole } from '@/lib/admin/help-center/search'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function AdminHelpPage() {
  const summary = await requireAdminPageAccess('/admin/help')
  const articles = filterArticlesForRole(HELP_ARTICLES, summary.appRole)

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHeader
        eyebrow="Knowledge"
        title="Help & SOPs"
        description="Searchable standard operating procedures for bookings, fleet, finance, KYC, and emergencies — staff only."
      />
      <AdminHelpHub articles={articles} role={summary.appRole} />
    </div>
  )
}
