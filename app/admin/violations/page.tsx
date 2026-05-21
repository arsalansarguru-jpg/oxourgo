import { AdminViolationsPageBody } from '@/components/admin/violations/admin-violations-page-body'
import { adminListViolations, adminViolationMetrics } from '@/lib/admin/data/violations'

export const dynamic = 'force-dynamic'

export default async function AdminViolationsPage() {
  let metrics = {
    totalFinesCollectedRupees: 0,
    outstandingLiabilitiesRupees: 0,
    openViolationsCount: 0,
    topViolationTypes: [] as Awaited<ReturnType<typeof adminViolationMetrics>>['topViolationTypes'],
  }
  let violations: Awaited<ReturnType<typeof adminListViolations>> = []

  try {
    ;[metrics, violations] = await Promise.all([adminViolationMetrics(), adminListViolations()])
  } catch {
    /* safe empty state */
  }

  return <AdminViolationsPageBody metrics={metrics} violations={violations} />
}
