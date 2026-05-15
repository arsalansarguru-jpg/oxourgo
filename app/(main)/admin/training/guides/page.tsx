import { AdminTrainingRoleGuides } from '@/components/admin/training/admin-training-role-guides'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { TRAINING_MODULES } from '@/lib/admin/training/modules'
import { getRoleGuidesForRole } from '@/lib/admin/training/role-guides'
import { filterModulesForRole } from '@/lib/admin/training/search'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function AdminTrainingGuidesPage() {
  const summary = await requireAdminPageAccess('/admin/training/guides')
  const guides = getRoleGuidesForRole(summary.appRole)
  const allowed = filterModulesForRole([...TRAINING_MODULES], summary.appRole)
  const modulesBySlug = new Map(allowed.map((m) => [m.slug, m]))

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHeader
        eyebrow="Curriculum"
        title="Role-based guides"
        description="Recommended training paths curated for your staff role."
      />
      <AdminTrainingRoleGuides guides={guides} modulesBySlug={modulesBySlug} />
    </div>
  )
}
