import { notFound } from 'next/navigation'

import { AdminTrainingModule } from '@/components/admin/training/admin-training-module'
import { TRAINING_MODULES } from '@/lib/admin/training/modules'
import { filterModulesForRole, getModuleBySlug } from '@/lib/admin/training/search'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function AdminTrainingModulePage({ params }: Props) {
  const summary = await requireAdminPageAccess('/admin/training')
  const { slug } = await params
  const mod = getModuleBySlug([...TRAINING_MODULES], slug)
  if (!mod) notFound()

  const allowed = filterModulesForRole([mod], summary.appRole)
  if (allowed.length === 0) notFound()

  return <AdminTrainingModule module={mod} />
}
