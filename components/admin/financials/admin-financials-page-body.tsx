import Link from 'next/link'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import type { AdminFinancialMetrics, AdminPenaltyRow } from '@/lib/admin/data/financials'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

export function AdminFinancialsPageBody({
  metrics,
  penaltyRows,
  highlightBookingId,
}: {
  metrics: AdminFinancialMetrics
  penaltyRows: AdminPenaltyRow[]
  highlightBookingId?: string | null
}) {
  return (
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow="Treasury"
        title="Deposits & penalties"
        description="Security deposit lifecycle, trip deductions, and refund settlement — separate from rental payment collection."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <OverviewCard
          label="Deposits held"
          value={formatInr(metrics.totalDepositsHeldRupees)}
          hint="Received or partially refunded — still on books"
          accent="violet"
        />
        <OverviewCard
          label="Pending refunds"
          value={String(metrics.pendingRefundsCount)}
          sub={formatInr(metrics.pendingRefundsRupees)}
          hint="Trips awaiting deposit release"
          accent="amber"
        />
        <OverviewCard
          label="Withheld deposits"
          value={String(metrics.withheldDepositsCount)}
          sub={formatInr(metrics.withheldDepositsRupees)}
          hint="No refund issued — penalties or disputes"
          accent="rose"
        />
        <OverviewCard
          label="Outstanding fines"
          value={formatInr(metrics.outstandingFinesRupees)}
          hint="Pending, notified, or disputed violations"
          accent="amber"
        />
        <OverviewCard
          label="Fines collected"
          value={formatInr(metrics.finesCollectedRupees)}
          hint="Paid or deducted from deposit"
          accent="violet"
        />
      </div>

      <AdminCard>
        <AdminCardContent className="space-y-4 p-5 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-soft">Penalty management</h2>
              <p className="text-sm text-muted">Bookings with active deduction lines — open a booking to settle deposit and refund.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/admin/violations" className="text-xs font-semibold text-electric underline-offset-4 hover:underline">
                Violations →
              </Link>
              <Link href="/admin/payments" className="text-xs font-semibold text-electric underline-offset-4 hover:underline">
                Rental payments →
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto admin-table-scroll rounded-2xl border border-white/[0.06]">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Penalties</th>
                  <th className="px-4 py-3">Deposit</th>
                  <th className="px-4 py-3">Refundable</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {penaltyRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      No penalty lines recorded yet.
                    </td>
                  </tr>
                ) : (
                  penaltyRows.map((row) => (
                    <tr
                      key={row.bookingId}
                      className={cn(
                        'border-b border-white/[0.04] transition hover:bg-white/[0.03]',
                        highlightBookingId === row.bookingId && 'bg-violet-500/[0.08]',
                      )}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/bookings/${row.bookingId}`}
                          className="font-medium text-electric underline-offset-2 hover:underline"
                        >
                          {new Date(row.pickupDate).toLocaleDateString()}
                        </Link>
                        <p className="mt-0.5 font-mono text-[10px] text-muted">{row.bookingId.slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-3 text-soft">{row.vehicleLabel}</td>
                      <td className="px-4 py-3 tabular-nums font-medium text-soft">{formatInr(row.penaltyTotalRupees)}</td>
                      <td className="px-4 py-3">
                        <span className="tabular-nums text-soft">{formatInr(row.depositAmountRupees)}</span>
                        <div className="mt-1">
                          <AdminStatusPill value={row.depositStatus} />
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-emerald-200/90">{formatInr(row.refundableBalanceRupees)}</td>
                      <td className="px-4 py-3">
                        <AdminStatusPill value={row.bookingStatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}

function OverviewCard({
  label,
  value,
  sub,
  hint,
  accent,
}: {
  label: string
  value: string
  sub?: string
  hint: string
  accent: 'violet' | 'amber' | 'rose'
}) {
  const gradient =
    accent === 'violet'
      ? 'from-violet-500/[0.09]'
      : accent === 'amber'
        ? 'from-amber-500/[0.09]'
        : 'from-rose-500/[0.08]'

  return (
    <AdminCard className={cn('border border-white/[0.06] bg-gradient-to-br via-transparent to-transparent p-5 sm:p-6', gradient)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-soft">{value}</p>
      {sub ? <p className="mt-1 text-lg tabular-nums text-muted">{sub}</p> : null}
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </AdminCard>
  )
}
