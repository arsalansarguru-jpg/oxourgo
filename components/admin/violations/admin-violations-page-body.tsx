import Link from 'next/link'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import type { AdminViolationMetrics, AdminViolationWithBooking } from '@/lib/admin/data/violations'
import { VIOLATION_TYPE_LABELS, violationTypeLabel, type ViolationType } from '@/lib/booking/violations'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

function vehicleLabel(row: AdminViolationWithBooking & { vehicleLabel?: string }): string {
  if (row.vehicleLabel) return row.vehicleLabel
  const v = row.booking?.vehicles
  const one = Array.isArray(v) ? v[0] : v
  return one?.name?.trim() || one?.brand?.trim() || 'Vehicle'
}

export function AdminViolationsPageBody({
  metrics,
  violations,
}: {
  metrics: AdminViolationMetrics
  violations: Array<AdminViolationWithBooking & { vehicleLabel?: string }>
}) {
  return (
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow="Compliance"
        title="Fines & violations"
        description="Traffic challans, tolls, parking, towing, and damage liabilities across all trips — linked to deposits and customer notifications."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard label="Fines collected" value={formatInr(metrics.totalFinesCollectedRupees)} accent="emerald" />
        <OverviewCard
          label="Outstanding liabilities"
          value={formatInr(metrics.outstandingLiabilitiesRupees)}
          accent="amber"
        />
        <OverviewCard label="Open violations" value={String(metrics.openViolationsCount)} accent="rose" />
        <OverviewCard
          label="Top violation type"
          accent="rose"
          value={
            metrics.topViolationTypes[0]
              ? VIOLATION_TYPE_LABELS[metrics.topViolationTypes[0].type as ViolationType]
              : '—'
          }
          hint={
            metrics.topViolationTypes[0]
              ? `${metrics.topViolationTypes[0].count} records · ${formatInr(metrics.topViolationTypes[0].totalRupees)}`
              : 'No data yet'
          }
        />
      </div>

      {metrics.topViolationTypes.length > 0 ? (
        <AdminCard>
          <AdminCardContent className="space-y-4 p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-soft">Most common violations</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.topViolationTypes.map((t) => (
                <li
                  key={t.type}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm"
                >
                  <span className="text-soft">{t.label}</span>
                  <span className="tabular-nums text-muted">
                    {t.count} · {formatInr(t.totalRupees)}
                  </span>
                </li>
              ))}
            </ul>
          </AdminCardContent>
        </AdminCard>
      ) : null}

      <AdminCard>
        <AdminCardContent className="space-y-4 p-5 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-soft">All violations</h2>
              <p className="text-sm text-muted">Open a booking to add challans, upload documents, and settle fines.</p>
            </div>
            <Link href="/admin/financials" className="text-xs font-semibold text-electric underline-offset-4 hover:underline">
              Deposits & penalties →
            </Link>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
            <table className="min-w-[880px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Trip</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {violations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted">
                      No violations recorded yet. Add one from a booking detail page.
                    </td>
                  </tr>
                ) : (
                  violations.map((row) => (
                    <tr key={row.id} className="border-b border-white/[0.04] transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/bookings/${row.booking_id}`}
                          className="font-medium text-electric underline-offset-2 hover:underline"
                        >
                          {vehicleLabel(row)}
                        </Link>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {new Date(row.booking.pickup_date).toLocaleDateString()} ·{' '}
                          <AdminStatusPill value={row.booking.booking_status} />
                        </p>
                      </td>
                      <td className="px-4 py-3 text-soft">{violationTypeLabel(row.violation_type)}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-muted" title={row.reason}>
                        {row.reason}
                      </td>
                      <td className="px-4 py-3 text-soft">{row.violation_date}</td>
                      <td className="px-4 py-3 tabular-nums font-medium text-soft">{formatInr(row.amount_rupees)}</td>
                      <td className="px-4 py-3">
                        <AdminStatusPill value={row.status} />
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
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent: 'emerald' | 'amber' | 'rose'
}) {
  const gradient =
    accent === 'emerald'
      ? 'from-emerald-500/[0.09]'
      : accent === 'amber'
        ? 'from-amber-500/[0.09]'
        : 'from-rose-500/[0.08]'

  return (
    <AdminCard className={cn('border border-white/[0.06] bg-gradient-to-br via-transparent to-transparent p-5', gradient)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-soft">{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </AdminCard>
  )
}
