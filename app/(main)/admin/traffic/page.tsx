import { AdminViolationsPageBody } from '@/components/admin/violations/admin-violations-page-body'
import { adminListViolations, adminViolationMetrics } from '@/lib/admin/data/violations'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function AdminTrafficPage() {
  await requireAdminPageAccess('/admin/traffic')

  let metrics = {
    totalFinesCollectedRupees: 0,
    outstandingLiabilitiesRupees: 0,
    openViolationsCount: 0,
    topViolationTypes: [] as Awaited<ReturnType<typeof adminViolationMetrics>>['topViolationTypes'],
  }
  let violations: Awaited<ReturnType<typeof adminListViolations>> = []

  try {
    ;[metrics, violations] = await Promise.all([
      adminViolationMetrics(),
      adminListViolations(120, 'traffic'),
    ])
  } catch {
    /* safe empty */
  }

  return (
    <AdminViolationsPageBody
      metrics={metrics}
      violations={violations}
      title="Traffic fine management"
      description="Upload challans, assign fines to bookings, notify customers, and track deposit deductions."
    />
  )
}
