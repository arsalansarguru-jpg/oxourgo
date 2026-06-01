import { AdminPaymentsPageBody } from '@/components/admin/payments/admin-payments-page-body'
import {
  adminBookingPaymentSummary,
  adminListPaymentEvents,
  adminPaymentOperationsMetrics,
  adminPaymentsBoardRows,
  type AdminPaymentOpsMetrics,
  type PaymentsBoardFilter,
} from '@/lib/admin/data/payments'
import { adminPageMetadata } from '@/lib/admin/page-metadata'

export const dynamic = 'force-dynamic'

export const metadata = adminPageMetadata('Payments')

function parseFilter(raw: string | undefined): PaymentsBoardFilter {
  const v = (raw ?? '').trim().toLowerCase()
  if (v === 'pending' || v === 'received' || v === 'refunded' || v === 'partial') return v
  return 'all'
}

const emptyMetrics: AdminPaymentOpsMetrics = {
  pendingCollectionRupees: 0,
  collectedRentalRupees: 0,
  pendingBookingCount: 0,
  grossPendingContractRupees: 0,
}

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams
  const filter = parseFilter(sp.status)

  let metrics = emptyMetrics
  let summary: Awaited<ReturnType<typeof adminBookingPaymentSummary>> = []
  let rows: Awaited<ReturnType<typeof adminPaymentsBoardRows>> = []
  let events: Awaited<ReturnType<typeof adminListPaymentEvents>> = []

  try {
    ;[metrics, summary, rows, events] = await Promise.all([
      adminPaymentOperationsMetrics(),
      adminBookingPaymentSummary(),
      adminPaymentsBoardRows(filter),
      adminListPaymentEvents(120),
    ])
  } catch {
    metrics = emptyMetrics
    summary = []
    rows = []
    events = []
  }

  return (
    <AdminPaymentsPageBody filter={filter} metrics={metrics} summary={summary} rows={rows} events={events} />
  )
}
