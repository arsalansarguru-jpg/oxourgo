import Link from 'next/link'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import type { AdminBookingListItem } from '@/lib/admin/data/bookings'
import { formatBookingVehicleTitle } from '@/lib/customer/booking-display'
import type {
  AdminPaymentOpsMetrics,
  BookingPaymentSummary,
  PaymentEventRow,
  PaymentsBoardFilter,
} from '@/lib/admin/data/payments'
import { formatInr } from '@/lib/format'
import { formatPaymentMethodLabel } from '@/lib/payments/booking-payment'
import { cn } from '@/lib/utils/cn'

const FILTERS: { id: PaymentsBoardFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'partial', label: 'Partial' },
  { id: 'received', label: 'Received' },
  { id: 'refunded', label: 'Refunded' },
]

function invoiceRef(bookingId: string) {
  return `OX-${bookingId.replace(/-/g, '').slice(0, 10).toUpperCase()}`
}

function filterHref(f: PaymentsBoardFilter) {
  return f === 'all' ? '/admin/payments' : `/admin/payments?status=${f}`
}

export function AdminPaymentsPageBody({
  filter,
  metrics,
  summary,
  rows,
  events,
}: {
  filter: PaymentsBoardFilter
  metrics: AdminPaymentOpsMetrics
  summary: BookingPaymentSummary[]
  rows: AdminBookingListItem[]
  events: PaymentEventRow[]
}) {
  return (
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow="Treasury"
        title="Payment operations"
        description="Pay-at-pickup and operational collections — amounts, statuses, and ledger lines. Online PSP checkout is not wired yet."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard className="border border-white/[0.06] bg-gradient-to-br from-amber-500/[0.07] via-transparent to-transparent p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Pending collection</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-soft">
            {formatInr(metrics.pendingCollectionRupees)}
          </p>
          <p className="mt-1 text-xs text-muted">{metrics.pendingBookingCount} open booking(s) with balance due</p>
        </AdminCard>
        <AdminCard className="border border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-transparent p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Revenue received</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-soft">
            {formatInr(metrics.collectedRentalRupees)}
          </p>
          <p className="mt-1 text-xs text-muted">Sum of recorded rental collections (full + partial)</p>
        </AdminCard>
        <AdminCard className="border border-white/[0.06] bg-gradient-to-br from-sky-500/[0.07] via-transparent to-transparent p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Outstanding contracts</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-soft">
            {formatInr(metrics.grossPendingContractRupees)}
          </p>
          <p className="mt-1 text-xs text-muted">Gross rental on bookings still in payment pending (excl. partial)</p>
        </AdminCard>
        <AdminCard className="p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Status distribution</p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            {summary.length === 0 ? <li>No booking rows loaded.</li> : null}
            {summary.slice(0, 5).map((s) => (
              <li key={s.payment_status} className="flex justify-between gap-2 tabular-nums">
                <span className="capitalize text-soft">{s.payment_status.replace(/_/g, ' ')}</span>
                <span>{s.count}</span>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.id === filter
          return (
            <Link
              key={f.id}
              href={filterHref(f.id)}
              className={cn(
                'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
                active
                  ? 'border-electric/50 bg-electric/15 text-soft shadow-[0_0_0_1px_rgba(59,130,246,0.35)]'
                  : 'border-stroke-strong bg-fill-glass text-muted hover:border-stroke hover:text-soft',
              )}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <AdminCard className="overflow-hidden">
        <AdminCardContent className="p-0">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">Booking payment queue</h2>
            <p className="mt-1 text-sm text-muted">Customer, vehicle, balance due, and status — open a row for collection actions.</p>
          </div>
          <div className="overflow-x-auto scroll-touch">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-4 py-3.5 font-medium">Customer</th>
                  <th className="px-4 py-3.5 font-medium">Booking</th>
                  <th className="px-4 py-3.5 font-medium">Vehicle</th>
                  <th className="px-4 py-3.5 font-medium">Method</th>
                  <th className="px-4 py-3.5 font-medium">Pending</th>
                  <th className="px-4 py-3.5 font-medium">Due</th>
                  <th className="px-4 py-3.5 font-medium">Status</th>
                  <th className="px-4 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="admin-table-row">
                    <td className="px-4 py-3">
                      <p className="font-medium text-soft">{b.customerFullName?.trim() || '—'}</p>
                      <p className="text-xs text-muted">{b.customerEmail ?? b.user_id}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-soft">{invoiceRef(b.id)}</td>
                    <td className="px-4 py-3 text-soft">{formatBookingVehicleTitle(b)}</td>
                    <td className="px-4 py-3 text-muted">{formatPaymentMethodLabel(b.payment_method)}</td>
                    <td className="px-4 py-3 tabular-nums text-soft">{formatInr(Math.max(0, b.amount_due ?? 0))}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">{formatInr(Math.max(0, b.total_rupees ?? 0))}</td>
                    <td className="px-4 py-3">
                      <AdminStatusPill value={b.payment_status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="font-medium text-electric transition-colors hover:text-electric/85"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 ? (
            <div className="border-t border-white/[0.04] px-6 py-14 text-center">
              <p className="text-sm font-medium text-soft">No bookings in this view</p>
              <p className="mt-2 text-sm text-muted">Adjust filters or check back after new reservations.</p>
              <Link
                href="/admin/bookings"
                className="mt-6 inline-flex text-sm font-semibold text-electric underline-offset-4 hover:underline"
              >
                Browse all bookings
              </Link>
            </div>
          ) : null}
        </AdminCardContent>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <AdminCardContent className="p-0">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">Recent ledger activity</h2>
            <p className="mt-1 text-sm text-muted">Cross-booking payment_events — newest first.</p>
          </div>
          <div className="overflow-x-auto scroll-touch">
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
            <p className="p-6 text-sm text-muted">No ledger rows yet — collection actions create rental_collection entries.</p>
          ) : null}
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}
