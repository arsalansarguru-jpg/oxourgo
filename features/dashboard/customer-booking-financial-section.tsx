import {
  buildDeductionsSnapshot,
  depositStatusLabel,
  PENALTY_CATEGORY_EXPLANATIONS,
  penaltyAmountsFromBooking,
  penaltyNotesFromJson,
  resolveDepositAmount,
  type PenaltyCategory,
} from '@/lib/booking/financial'
import { formatInr } from '@/lib/format'
import type { BookingWithCar } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'

function depositBadgeVariant(status: string | null | undefined): 'default' | 'success' | 'muted' | 'danger' | 'electric' {
  switch (status) {
    case 'received':
      return 'success'
    case 'partially_refunded':
      return 'electric'
    case 'refunded':
      return 'muted'
    case 'withheld':
      return 'danger'
    default:
      return 'default'
  }
}

export function CustomerBookingFinancialSection({ row }: { row: BookingWithCar }) {
  const vehicle = row.vehicles
  const veh = Array.isArray(vehicle) ? vehicle[0] : vehicle
  const depositAmount = resolveDepositAmount({
    deposit_amount: row.deposit_amount,
    deposit_held_rupees: row.deposit_held_rupees,
    vehicle_security_deposit: veh?.security_deposit,
  })
  const amounts = penaltyAmountsFromBooking(row)
  const notes = penaltyNotesFromJson(row.penalty_notes)
  const snapshot = buildDeductionsSnapshot({
    amounts,
    depositAmountRupees: depositAmount,
    depositAppliedRupees: row.deposit_penalty_total_rupees,
    notes,
  })
  const penaltyTotal = row.penalty_total ?? snapshot.penalty_total_rupees
  const hasCharges = penaltyTotal > 0 || snapshot.deposit_applied_rupees > 0
  const depositStatus = row.deposit_status ?? 'pending'
  const refundDue =
    row.refund_amount != null && row.refund_amount > 0
      ? row.refund_amount
      : depositStatus === 'refunded' || depositStatus === 'partially_refunded'
        ? row.deposit_refunded_rupees ?? snapshot.refundable_balance_rupees
        : snapshot.refundable_balance_rupees

  if (!depositAmount && !hasCharges && depositStatus === 'pending') {
    return null
  }

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.06] via-transparent to-transparent p-5">
      <FinancialHeader depositStatus={depositStatus} />

      <dl className="grid gap-3 sm:grid-cols-3">
        <FinancialStat label="Security deposit" value={formatInr(depositAmount)} />
        <FinancialStat label="Total deductions" value={formatInr(penaltyTotal)} />
        <FinancialStat
          label={depositStatus === 'refunded' || depositStatus === 'partially_refunded' ? 'Refunded' : 'Refund due'}
          value={formatInr(refundDue)}
          highlight
        />
      </dl>

      {hasCharges ? (
        <div className="rounded-xl border border-amber-400/15 bg-amber-500/[0.05] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-100/90">Deductions breakdown</p>
          <ul className="mt-3 space-y-3 text-sm">
            {snapshot.lines.map((line) => (
              <li key={line.category} className="border-b border-stroke/60 pb-3 last:border-0 last:pb-0">
                <DeductionLine line={line} notes={notes} />
              </li>
            ))}
            {snapshot.deposit_applied_rupees > 0 ? (
              <li className="flex justify-between gap-4 border-t border-stroke pt-3 font-medium text-soft">
                <span>Applied from your deposit</span>
                <span className="tabular-nums">{formatInr(snapshot.deposit_applied_rupees)}</span>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {row.refund_processed_at ? (
        <p className="text-xs text-muted">
          Refund processed {new Date(row.refund_processed_at).toLocaleString()}
          {row.deposit_refunded_at ? ` · Recorded ${new Date(row.deposit_refunded_at).toLocaleString()}` : ''}
        </p>
      ) : depositStatus === 'received' && snapshot.refundable_balance_rupees > 0 ? (
        <p className="text-xs leading-relaxed text-muted">
          Your refundable balance is being reviewed after return inspection. Concierge will confirm once the refund is
          initiated.
        </p>
      ) : null}
    </div>
  )
}

function FinancialHeader({ depositStatus }: { depositStatus: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Deposit &amp; settlement</p>
        <h3 className="text-base font-semibold text-soft">Financial summary</h3>
      </div>
      <Badge variant={depositBadgeVariant(depositStatus)}>Deposit · {depositStatusLabel(depositStatus)}</Badge>
    </div>
  )
}

function FinancialStat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={cn('rounded-xl border border-stroke bg-matte/[0.35] p-3', highlight && 'border-emerald-400/20')}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums text-soft">{value}</dd>
    </div>
  )
}

function DeductionLine({
  line,
  notes,
}: {
  line: { category: PenaltyCategory; label: string; amount_rupees: number; note: string | null }
  notes: Partial<Record<PenaltyCategory, string | null>>
}) {
  const explanation = PENALTY_CATEGORY_EXPLANATIONS[line.category]
  const note = line.note || notes[line.category]
  return (
    <div>
      <DeductionLineHeader label={line.label} amount={line.amount_rupees} />
      <p className="mt-1 text-xs text-muted">{explanation}</p>
      {note ? <p className="mt-1 text-xs italic text-silver/90">Note: {note}</p> : null}
    </div>
  )
}

function DeductionLineHeader({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between gap-4 text-soft">
      <span>{label}</span>
      <span className="tabular-nums">{formatInr(amount)}</span>
    </div>
  )
}
