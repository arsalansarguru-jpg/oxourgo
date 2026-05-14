import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { adminBookingPaymentSummary, adminListPaymentEvents } from '@/lib/admin/data/payments'
import { formatInr } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
  let events: Awaited<ReturnType<typeof adminListPaymentEvents>> = []
  let summary: Awaited<ReturnType<typeof adminBookingPaymentSummary>> = []
  try {
    events = await adminListPaymentEvents()
    summary = await adminBookingPaymentSummary()
  } catch {
    events = []
    summary = []
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Finance"
        title="Payments monitoring"
        description="Ledger lines from payment_events plus booking-level payment_status distribution. Refund and deposit rows are placeholders until PSP wiring."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((s) => (
          <AdminCard key={s.payment_status} className="p-5 transition-transform duration-300 hover:-translate-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              {s.payment_status.replace(/_/g, ' ')}
            </p>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-soft">{s.count}</p>
            <p className="mt-1 text-xs text-muted">Bookings</p>
          </AdminCard>
        ))}
      </div>

      <AdminCard className="overflow-hidden">
        <AdminCardContent className="p-0">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">Recent payment events</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-4 py-3.5 font-medium">When</th>
                  <th className="px-4 py-3.5 font-medium">Title</th>
                  <th className="px-4 py-3.5 font-medium">Direction</th>
                  <th className="px-4 py-3.5 font-medium">Status</th>
                  <th className="px-4 py-3.5 font-medium">Amount</th>
                  <th className="px-4 py-3.5 font-medium">Booking</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="admin-table-row">
                    <td className="px-4 py-3 text-muted">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-soft">{e.title}</td>
                    <td className="px-4 py-3">
                      <AdminStatusPill value={e.direction} />
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusPill value={e.status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-soft">{formatInr(e.amount_rupees)}</td>
                    <td className="px-4 py-3 text-right">
                      {e.booking_id ? (
                        <Link
                          href={`/admin/bookings/${e.booking_id}`}
                          className="font-medium text-electric transition-colors hover:text-electric/85"
                        >
                          Open
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {events.length === 0 ? (
            <p className="p-6 text-sm text-muted">No payment_events yet — placeholders can be created from a booking.</p>
          ) : null}
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}
