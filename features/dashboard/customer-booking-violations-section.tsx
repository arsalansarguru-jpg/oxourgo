import { AlertTriangle, FileText, Gavel } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import type { CustomerBookingViolationsBundle } from '@/lib/customer/violations-queries'
import {
  violationStatusLabel,
  violationTypeLabel,
  type ViolationRow,
} from '@/lib/booking/violations'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

function statusBadgeVariant(status: string): 'default' | 'success' | 'muted' | 'danger' | 'electric' {
  switch (status) {
    case 'paid':
    case 'deducted_from_deposit':
      return 'success'
    case 'customer_notified':
      return 'electric'
    case 'disputed':
      return 'danger'
    default:
      return 'default'
  }
}

function ViolationDetail({
  violation,
  challanUrl,
}: {
  violation: ViolationRow
  challanUrl?: string
}) {
  return (
    <li className="rounded-xl border border-stroke/80 bg-matte/[0.35] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">{violationTypeLabel(violation.violation_type)}</p>
          <p className="mt-1 text-sm text-muted">{violation.reason}</p>
        </div>
        <div className="text-right">
          <Badge variant={statusBadgeVariant(violation.status)}>{violationStatusLabel(violation.status)}</Badge>
          <p className="mt-2 text-lg font-semibold tabular-nums text-soft">{formatInr(violation.amount_rupees)}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted">Violation date</dt>
          <dd className="text-soft">{violation.violation_date}</dd>
        </div>
        <div>
          <dt className="text-muted">Authority</dt>
          <dd className="text-soft">{violation.authority_source?.trim() || '—'}</dd>
        </div>
      </dl>

      {violation.status === 'deducted_from_deposit' ? (
        <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-100/95">
          {formatInr(violation.amount_deducted_rupees)} applied from your security deposit.
        </p>
      ) : null}

      {violation.status === 'paid' && violation.amount_paid_rupees > 0 ? (
        <p className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-100/95">
          Payment of {formatInr(violation.amount_paid_rupees)} recorded
          {violation.paid_at ? ` on ${new Date(violation.paid_at).toLocaleDateString()}` : ''}.
        </p>
      ) : null}

      {violation.status === 'disputed' ? (
        <p className="mt-3 flex gap-2 rounded-lg border border-red-400/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-100/95">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          This charge is under review. Concierge will contact you if more information is needed.
        </p>
      ) : null}

      {challanUrl ? (
        <a
          href={challanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-electric underline-offset-4 hover:underline"
        >
          <FileText className="h-3.5 w-3.5" aria-hidden />
          View challan copy
        </a>
      ) : null}
    </li>
  )
}

export function CustomerBookingViolationsSection({
  bundle,
}: {
  bundle: CustomerBookingViolationsBundle
}) {
  if (bundle.violations.length === 0) return null

  const hasOutstanding = bundle.summary.outstandingRupees > 0

  return (
    <div
      className={cn(
        'mt-6 space-y-4 rounded-2xl border p-5',
        hasOutstanding
          ? 'border-amber-400/20 bg-gradient-to-br from-amber-500/[0.07] via-transparent to-transparent'
          : 'border-stroke/80 bg-matte/[0.2]',
      )}
    >
      <div className="flex items-start gap-3">
        <Gavel className="mt-0.5 h-5 w-5 shrink-0 text-amber-200/80" aria-hidden />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Trip compliance</p>
          <h3 className="text-base font-semibold text-soft">Fines & violations</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Charges recorded during your rental. Outstanding amounts may be collected from your deposit or via concierge.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Outstanding" value={formatInr(bundle.summary.outstandingRupees)} highlight={hasOutstanding} />
        <Stat label="Settled" value={formatInr(bundle.summary.collectedRupees)} />
        <Stat label="Total recorded" value={formatInr(bundle.summary.totalLiabilityRupees)} />
      </div>

      <ul className="space-y-3">
        {bundle.violations.map((v) => (
          <ViolationDetail key={v.id} violation={v} challanUrl={bundle.challanSignedUrls[v.id]} />
        ))}
      </ul>
    </div>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={cn('rounded-lg border border-stroke/60 px-3 py-2', highlight && 'border-amber-400/25 bg-amber-500/[0.05]')}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums text-soft">{value}</dd>
    </div>
  )
}
