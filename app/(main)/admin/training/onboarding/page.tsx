import { AdminTrainingOnboarding } from '@/components/admin/training/admin-training-onboarding'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { getTrainingOnboardingForRole } from '@/lib/admin/training/onboarding'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function AdminTrainingOnboardingPage() {
  const summary = await requireAdminPageAccess('/admin/training/onboarding')
  const tracks = getTrainingOnboardingForRole(summary.appRole)

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHeader
        eyebrow="Onboarding"
        title="Admin walkthroughs"
        description="Step-by-step paths for your role — complete before handling live bookings."
      />
      <AdminTrainingOnboarding tracks={tracks} />
    </div>
  )
}
