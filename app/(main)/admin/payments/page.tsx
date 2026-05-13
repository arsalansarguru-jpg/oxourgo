import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { adminBookingPaymentSummary, adminListPaymentEvents } from '@/lib/admin/data/payments'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'
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
          <Card key={s.payment_status} className={cn(cardSurfaceBase, 'border border-stroke')}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{s.payment_status.replace(/_/g, ' ')}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-soft">{s.count}</p>
              <p className="mt-1 text-xs text-muted">Bookings</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={cn(cardSurfaceBase, 'overflow-hidden border border-stroke')}>
        <CardContent className="p-0">
          <div className="border-b border-stroke px-5 py-4">
            <h2 className="text-lg font-semibold text-soft">Recent payment events</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-stroke bg-fill-glass text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Direction</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Booking</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-stroke">
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
                        <Link href={`/admin/bookings/${e.booking_id}`} className="text-electric hover:underline">
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
        </CardContent>
      </Card>
    </div>
  )
}
