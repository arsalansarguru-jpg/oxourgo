import { AdminHelpOnboarding } from '@/components/admin/help-center/admin-help-onboarding'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { getOnboardingTracksForRole } from '@/lib/admin/help-center/onboarding'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function AdminHelpOnboardingPage() {
  const summary = await requireAdminPageAccess('/admin/help/onboarding')
  const tracks = getOnboardingTracksForRole(summary.appRole)

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHeader
        eyebrow="Onboarding"
        title="Staff walkthroughs"
        description="Role-based first-week paths linking to live admin screens and SOPs."
      />
      <AdminHelpOnboarding tracks={tracks} />
    </div>
  )
}
