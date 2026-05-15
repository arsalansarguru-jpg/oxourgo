import { AdminFinancialsPageBody } from '@/components/admin/financials/admin-financials-page-body'
import {
  adminFinancialMetrics,
  adminPenaltyManagementRows,
  type AdminFinancialMetrics,
} from '@/lib/admin/data/financials'

export const dynamic = 'force-dynamic'

const emptyMetrics: AdminFinancialMetrics = {
  totalDepositsHeldRupees: 0,
  pendingRefundsCount: 0,
  pendingRefundsRupees: 0,
  withheldDepositsCount: 0,
  withheldDepositsRupees: 0,
}

export default async function AdminFinancialsPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>
}) {
  const sp = await searchParams
  const highlightBookingId = sp.booking?.trim() || null

  let metrics = emptyMetrics
  let penaltyRows: Awaited<ReturnType<typeof adminPenaltyManagementRows>> = []

  try {
    ;[metrics, penaltyRows] = await Promise.all([adminFinancialMetrics(), adminPenaltyManagementRows()])
  } catch {
    metrics = emptyMetrics
    penaltyRows = []
  }

  return (
    <AdminFinancialsPageBody
      metrics={metrics}
      penaltyRows={penaltyRows}
      highlightBookingId={highlightBookingId}
    />
  )
}
