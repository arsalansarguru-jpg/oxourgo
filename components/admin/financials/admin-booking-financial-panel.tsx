'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition, type ReactNode } from 'react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  adminApplyBookingPenaltiesFullAction,
  adminMarkDepositReceivedAction,
  adminProcessDepositRefundAction,
  adminRecomputeBookingFinancialsAction,
  adminWithholdDepositAction,
} from '@/lib/admin/actions/deposit-financial-actions'
import type { AdminBookingFinancialSummary } from '@/lib/admin/data/financials'
import {
  buildDeductionsSnapshot,
  PENALTY_CATEGORIES,
  PENALTY_CATEGORY_LABELS,
  penaltyAmountsFromBooking,
  penaltyNotesFromJson,
  type PenaltyCategory,
} from '@/lib/booking/financial'
import { formatInr } from '@/lib/format'
import type { BookingWithCar } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils/cn'

const FIELD_TO_CATEGORY: Record<string, PenaltyCategory> = {
  late: 'late_return',
  fuel: 'fuel_shortage',
  km: 'extra_kilometers',
  clean: 'cleaning_fee',
  damage: 'damage_fee',
  traffic: 'traffic_fines',
}

function vehicleSecurityDeposit(booking: BookingWithCar): number {
  const v = booking.vehicles
  const one = Array.isArray(v) ? v[0] : v
  return Number(one?.security_deposit ?? 0)
}

function FinancialMetricCard({
  label,
  value,
  badge,
  highlight,
}: {
  label: string
  value: string
  badge?: ReactNode
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4',
        highlight && 'border-emerald-400/25 bg-emerald-500/[0.06]',
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <MetricCardBody value={value} badge={badge} />
    </div>
  )
}

function MetricCardBody({ value, badge }: { value: string; badge?: ReactNode }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <p className="text-xl font-semibold tabular-nums tracking-[-0.03em] text-soft">{value}</p>
      {badge}
    </div>
  )
}

function PenaltyField({
  name,
  label,
  defaultAmount,
  defaultNote,
}: {
  name: string
  label: string
  defaultAmount?: number | null
  defaultNote?: string | null
}) {
  const category = FIELD_TO_CATEGORY[name]
  return (
    <div className="space-y-2 rounded-xl border border-white/[0.06] bg-black/10 p-3">
      <Input name={name} type="number" min={0} label={`${label} (₹)`} defaultValue={defaultAmount ?? 0} className="min-h-10" />
      <input
        name={`note_${category}`}
        type="text"
        placeholder="Note for customer (optional)"
        defaultValue={defaultNote ?? ''}
        className="w-full rounded-lg border border-stroke-strong bg-matte/[0.55] px-3 py-2 text-xs text-soft placeholder:text-muted/80"
      />
    </div>
  )
}

export function AdminBookingFinancialPanel({
  booking,
  summary,
  compact = false,
}: {
  booking: BookingWithCar
  summary?: AdminBookingFinancialSummary | null
  compact?: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [manualOverride, setManualOverride] = useState(Boolean(booking.financial_manual_override))

  const depositAmount =
    summary?.depositAmountRupees ??
    booking.deposit_amount ??
    booking.deposit_held_rupees ??
    vehicleSecurityDeposit(booking)

  const deductions = useMemo(() => {
    if (summary?.deductions) return summary.deductions
    return buildDeductionsSnapshot({
      amounts: penaltyAmountsFromBooking(booking),
      depositAmountRupees: depositAmount,
      depositAppliedRupees: booking.deposit_penalty_total_rupees,
      manualOverride: booking.financial_manual_override,
      notes: penaltyNotesFromJson(booking.penalty_notes),
    })
  }, [summary, booking, depositAmount])

  const notes = penaltyNotesFromJson(booking.penalty_notes)
  const depositStatus = booking.deposit_status ?? 'pending'
  const canReceive = depositStatus === 'pending'
  const canRefund = depositStatus === 'received' || depositStatus === 'partially_refunded'
  const closed = depositStatus === 'refunded' || depositStatus === 'withheld'
  const refundAmount = booking.refund_amount ?? deductions.refundable_balance_rupees

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setMsg(null)
    start(async () => {
      const r = await fn()
      if (!r.ok) setMsg(r.message ?? 'Request failed')
      router.refresh()
    })
  }

  return (
    <AdminCard className="border border-white/[0.06] bg-gradient-to-br from-violet-500/[0.04] via-transparent to-transparent">
      <AdminCardContent className={cn('space-y-5', compact ? 'p-4 sm:p-5' : 'p-5 sm:p-7')}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Deposit &amp; penalties</p>
            <h2 className={cn('font-semibold text-soft', compact ? 'text-base' : 'text-lg')}>Financial settlement</h2>
            <p className="mt-1 text-xs text-muted">
              Rental payment flows are unchanged — this panel only manages security deposit and trip deductions.
            </p>
          </div>
          <Link href="/admin/financials" className="text-xs font-semibold text-electric underline-offset-4 hover:underline">
            Treasury overview →
          </Link>
        </div>

        <MetricsGrid
          depositAmount={depositAmount}
          depositStatus={depositStatus}
          deductions={deductions}
          refundAmount={refundAmount}
        />

        {msg ? (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100" role="alert">
            {msg}
          </p>
        ) : null}

        <DepositActionBar
          pending={pending}
          canReceive={canReceive}
          canRefund={canRefund}
          closed={closed}
          depositAmount={depositAmount}
          suggestedRefund={deductions.refundable_balance_rupees}
          bookingId={booking.id}
          run={run}
        />

        <PenaltiesForm
          booking={booking}
          notes={notes}
          manualOverride={manualOverride}
          setManualOverride={setManualOverride}
          deductions={deductions}
          pending={pending}
          run={run}
        />
      </AdminCardContent>
    </AdminCard>
  )
}

function MetricsGrid({
  depositAmount,
  depositStatus,
  deductions,
  refundAmount,
}: {
  depositAmount: number
  depositStatus: string
  deductions: ReturnType<typeof buildDeductionsSnapshot>
  refundAmount: number
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <FinancialMetricCard label="Deposit" value={formatInr(depositAmount)} badge={<AdminStatusPill value={depositStatus} />} />
      <FinancialMetricCard label="Total deductions" value={formatInr(deductions.penalty_total_rupees)} />
      <FinancialMetricCard label="Applied from deposit" value={formatInr(deductions.deposit_applied_rupees)} />
      <FinancialMetricCard label="Refundable balance" value={formatInr(refundAmount)} highlight />
    </div>
  )
}

function DepositActionBar({
  pending,
  canReceive,
  canRefund,
  closed,
  depositAmount,
  suggestedRefund,
  bookingId,
  run,
}: {
  pending: boolean
  canReceive: boolean
  canRefund: boolean
  closed: boolean
  depositAmount: number
  suggestedRefund: number
  bookingId: string
  run: (fn: () => Promise<{ ok: boolean; message?: string }>) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
      {canReceive ? (
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            run(() =>
              adminMarkDepositReceivedAction({
                bookingId,
                depositAmountRupees: depositAmount > 0 ? depositAmount : undefined,
              }),
            )
          }
        >
          Mark deposit received
        </Button>
      ) : null}
      {canRefund ? (
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => {
            const raw = window.prompt(`Refund amount (₹). Suggested: ${suggestedRefund}`, String(suggestedRefund))
            if (raw == null) return
            const amt = Number(raw)
            if (!Number.isFinite(amt)) return
            run(() => adminProcessDepositRefundAction({ bookingId, refundAmountRupees: amt }))
          }}
        >
          Process refund
        </Button>
      ) : null}
      {!closed ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (!window.confirm('Withhold the full deposit? This closes the refund path.')) return
            run(() => adminWithholdDepositAction({ bookingId }))
          }}
        >
          Withhold deposit
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(() => adminRecomputeBookingFinancialsAction(bookingId))}
      >
        Recalculate
      </Button>
    </div>
  )
}

function PenaltiesForm({
  booking,
  notes,
  manualOverride,
  setManualOverride,
  deductions,
  pending,
  run,
}: {
  booking: BookingWithCar
  notes: Partial<Record<PenaltyCategory, string | null>>
  manualOverride: boolean
  setManualOverride: (v: boolean) => void
  deductions: ReturnType<typeof buildDeductionsSnapshot>
  pending: boolean
  run: (fn: () => Promise<{ ok: boolean; message?: string }>) => void
}) {
  return (
    <form
      className="space-y-4 border-t border-white/[0.06] pt-4"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const notePatch: Partial<Record<PenaltyCategory, string | null>> = {}
        for (const cat of PENALTY_CATEGORIES) {
          const n = fd.get(`note_${cat}`)?.toString().trim()
          if (n) notePatch[cat] = n
        }
        run(async () =>
          adminApplyBookingPenaltiesFullAction({
            bookingId: booking.id,
            penaltyLateRupees: Number(fd.get('late') ?? 0),
            penaltyFuelRupees: Number(fd.get('fuel') ?? 0),
            penaltyExtraKmRupees: Number(fd.get('km') ?? 0),
            penaltyCleaningRupees: Number(fd.get('clean') ?? 0),
            penaltyDamageRupees: Number(fd.get('damage') ?? 0),
            penaltyTrafficRupees: Number(fd.get('traffic') ?? 0),
            depositPenaltyTotalRupees: manualOverride ? Number(fd.get('deposit_applied') ?? 0) : null,
            manualOverride,
            notes: notePatch,
          }),
        )
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-soft">Penalty lines</p>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={manualOverride}
            onChange={(e) => setManualOverride(e.target.checked)}
            className="rounded border-stroke-strong"
          />
          Manual deposit override
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <PenaltyField name="late" label={PENALTY_CATEGORY_LABELS.late_return} defaultAmount={booking.penalty_late_rupees} defaultNote={notes.late_return} />
        <PenaltyField name="fuel" label={PENALTY_CATEGORY_LABELS.fuel_shortage} defaultAmount={booking.penalty_fuel_rupees} defaultNote={notes.fuel_shortage} />
        <PenaltyField name="km" label={PENALTY_CATEGORY_LABELS.extra_kilometers} defaultAmount={booking.penalty_extra_km_rupees} defaultNote={notes.extra_kilometers} />
        <PenaltyField name="clean" label={PENALTY_CATEGORY_LABELS.cleaning_fee} defaultAmount={booking.penalty_cleaning_rupees} defaultNote={notes.cleaning_fee} />
        <PenaltyField name="damage" label={PENALTY_CATEGORY_LABELS.damage_fee} defaultAmount={booking.penalty_damage_rupees} defaultNote={notes.damage_fee} />
        <PenaltyField name="traffic" label={PENALTY_CATEGORY_LABELS.traffic_fines} defaultAmount={booking.penalty_traffic_rupees} defaultNote={notes.traffic_fines} />
      </div>
      {manualOverride ? (
        <Input
          name="deposit_applied"
          type="number"
          min={0}
          label="Deposit applied to penalties (₹) — override"
          defaultValue={booking.deposit_penalty_total_rupees ?? deductions.deposit_applied_rupees}
        />
      ) : (
        <p className="text-xs text-muted">
          Auto deposit applied: <span className="font-semibold text-soft">{formatInr(deductions.deposit_applied_rupees)}</span>
        </p>
      )}
      <Button type="submit" variant="secondary" disabled={pending}>
        Save penalties &amp; deductions
      </Button>
    </form>
  )
}
