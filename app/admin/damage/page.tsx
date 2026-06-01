import { AdminDamageDashboard } from '@/components/admin/damage/admin-damage-dashboard'
import { adminDamageMetrics, adminListDamageReports } from '@/lib/admin/data/damage-reports'
import { adminListViolations, adminViolationMetrics } from '@/lib/admin/data/violations'
import { adminPageMetadata } from '@/lib/admin/page-metadata'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export const metadata = adminPageMetadata('Damage & Penalties')

export default async function AdminDamagePage() {
  await requireAdminPageAccess('/admin/damage')

  let metrics = { openClaims: 0, underInspection: 0, totalLiabilityRupees: 0 }
  let reports: Awaited<ReturnType<typeof adminListDamageReports>> = []
  let violationMetrics = {
    totalFinesCollectedRupees: 0,
    outstandingLiabilitiesRupees: 0,
    openViolationsCount: 0,
    topViolationTypes: [] as Awaited<ReturnType<typeof adminViolationMetrics>>['topViolationTypes'],
  }
  let damageViolations: Awaited<ReturnType<typeof adminListViolations>> = []

  try {
    ;[metrics, reports, violationMetrics, damageViolations] = await Promise.all([
      adminDamageMetrics(),
      adminListDamageReports(),
      adminViolationMetrics(),
      adminListViolations(60, 'damage'),
    ])
  } catch {
    /* safe empty */
  }

  return (
    <AdminDamageDashboard
      metrics={metrics}
      reports={reports}
      violationMetrics={violationMetrics}
      damageViolations={damageViolations}
    />
  )
}
