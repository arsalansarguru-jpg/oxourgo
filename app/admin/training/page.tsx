import { AdminTrainingHub } from '@/components/admin/training/admin-training-hub'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { TRAINING_MODULES } from '@/lib/admin/training/modules'
import { filterModulesForRole } from '@/lib/admin/training/search'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function AdminTrainingPage() {
  const summary = await requireAdminPageAccess('/admin/training')
  const modules = filterModulesForRole([...TRAINING_MODULES], summary.appRole)

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHeader
        eyebrow="Handover"
        title="Training center"
        description="Internal tutorials, role-based guides, and owner dashboard training — searchable knowledge base for staff only."
      />
      <AdminTrainingHub modules={modules} role={summary.appRole} />
    </div>
  )
}
