/** Deposit and penalty financial model — shared by admin actions and customer views. */

import { safeRupees } from '@/lib/money/safe'

export const DEPOSIT_STATUSES = [
  'pending',
  'received',
  'partially_refunded',
  'refunded',
  'withheld',
] as const

export type DepositStatus = (typeof DEPOSIT_STATUSES)[number]

export const PENALTY_CATEGORIES = [
  'late_return',
  'fuel_shortage',
  'extra_kilometers',
  'cleaning_fee',
  'damage_fee',
  'traffic_fines',
] as const

export type PenaltyCategory = (typeof PENALTY_CATEGORIES)[number]

export const PENALTY_CATEGORY_LABELS: Record<PenaltyCategory, string> = {
  late_return: 'Late return',
  fuel_shortage: 'Fuel shortage',
  extra_kilometers: 'Extra kilometers',
  cleaning_fee: 'Cleaning fee',
  damage_fee: 'Damage fee',
  traffic_fines: 'Traffic fines',
}

export const PENALTY_CATEGORY_EXPLANATIONS: Record<PenaltyCategory, string> = {
  late_return: 'Charges for returning the vehicle after the agreed return time.',
  fuel_shortage: 'Refuel cost when the return fuel level is below the pickup level.',
  extra_kilometers: 'Charges for distance driven beyond the included allowance.',
  cleaning_fee: 'Professional cleaning required due to interior condition.',
  damage_fee: 'Repair or assessment costs for body or mechanical damage.',
  traffic_fines: 'Traffic or parking violations incurred during the rental period.',
}

export type PenaltyLineInput = {
  category: PenaltyCategory
  amountRupees: number
  note?: string | null
}

export type BookingPenaltyAmounts = {
  penaltyLateRupees: number
  penaltyFuelRupees: number
  penaltyExtraKmRupees: number
  penaltyCleaningRupees: number
  penaltyDamageRupees: number
  penaltyTrafficRupees: number
}

export type BookingDeductionsSnapshot = {
  lines: Array<{
    category: PenaltyCategory
    label: string
    amount_rupees: number
    note: string | null
  }>
  penalty_total_rupees: number
  deposit_amount_rupees: number
  deposit_applied_rupees: number
  refundable_balance_rupees: number
  computed_at: string
  manual_override?: boolean
}

export function penaltyAmountsFromBooking(row: {
  penalty_late_rupees?: number | null
  penalty_fuel_rupees?: number | null
  penalty_extra_km_rupees?: number | null
  penalty_cleaning_rupees?: number | null
  penalty_damage_rupees?: number | null
  penalty_traffic_rupees?: number | null
}): BookingPenaltyAmounts {
  return {
    penaltyLateRupees: Math.max(0, Math.round(row.penalty_late_rupees ?? 0)),
    penaltyFuelRupees: Math.max(0, Math.round(row.penalty_fuel_rupees ?? 0)),
    penaltyExtraKmRupees: Math.max(0, Math.round(row.penalty_extra_km_rupees ?? 0)),
    penaltyCleaningRupees: Math.max(0, Math.round(row.penalty_cleaning_rupees ?? 0)),
    penaltyDamageRupees: Math.max(0, Math.round(row.penalty_damage_rupees ?? 0)),
    penaltyTrafficRupees: Math.max(0, Math.round(row.penalty_traffic_rupees ?? 0)),
  }
}

export function computePenaltyTotal(amounts: BookingPenaltyAmounts): number {
  return (
    amounts.penaltyLateRupees +
    amounts.penaltyFuelRupees +
    amounts.penaltyExtraKmRupees +
    amounts.penaltyCleaningRupees +
    amounts.penaltyDamageRupees +
    amounts.penaltyTrafficRupees
  )
}

export function penaltyLinesFromAmounts(
  amounts: BookingPenaltyAmounts,
  notes?: Partial<Record<PenaltyCategory, string | null>>,
): PenaltyLineInput[] {
  const pairs: [PenaltyCategory, number][] = [
    ['late_return', amounts.penaltyLateRupees],
    ['fuel_shortage', amounts.penaltyFuelRupees],
    ['extra_kilometers', amounts.penaltyExtraKmRupees],
    ['cleaning_fee', amounts.penaltyCleaningRupees],
    ['damage_fee', amounts.penaltyDamageRupees],
    ['traffic_fines', amounts.penaltyTrafficRupees],
  ]
  return pairs
    .filter(([, amt]) => amt > 0)
    .map(([category, amountRupees]) => ({
      category,
      amountRupees,
      note: notes?.[category] ?? null,
    }))
}

/** Deposit applied toward penalties — capped at deposit and penalty totals unless overridden. */
export function computeDepositApplied(
  depositAmountRupees: number,
  penaltyTotalRupees: number,
  manualDepositApplied?: number | null,
): number {
  if (manualDepositApplied != null && Number.isFinite(manualDepositApplied)) {
    return Math.max(0, Math.min(Math.round(manualDepositApplied), depositAmountRupees))
  }
  return Math.min(depositAmountRupees, penaltyTotalRupees)
}

export function computeRefundableBalance(
  depositAmountRupees: number,
  depositAppliedRupees: number,
): number {
  return Math.max(0, depositAmountRupees - depositAppliedRupees)
}

export function buildDeductionsSnapshot(input: {
  amounts: BookingPenaltyAmounts
  depositAmountRupees: number
  depositAppliedRupees?: number | null
  manualOverride?: boolean
  notes?: Partial<Record<PenaltyCategory, string | null>>
  computedAt?: string
}): BookingDeductionsSnapshot {
  const penaltyTotal = computePenaltyTotal(input.amounts)
  const depositApplied = computeDepositApplied(
    input.depositAmountRupees,
    penaltyTotal,
    input.depositAppliedRupees,
  )
  const lines = penaltyLinesFromAmounts(input.amounts, input.notes).map((line) => ({
    category: line.category,
    label: PENALTY_CATEGORY_LABELS[line.category],
    amount_rupees: line.amountRupees,
    note: line.note?.trim() || null,
  }))

  return {
    lines,
    penalty_total_rupees: penaltyTotal,
    deposit_amount_rupees: input.depositAmountRupees,
    deposit_applied_rupees: depositApplied,
    refundable_balance_rupees: computeRefundableBalance(input.depositAmountRupees, depositApplied),
    computed_at: input.computedAt ?? new Date().toISOString(),
    ...(input.manualOverride ? { manual_override: true } : {}),
  }
}

export function depositStatusLabel(status: DepositStatus | string | null | undefined): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'received':
      return 'Received'
    case 'partially_refunded':
      return 'Partially refunded'
    case 'refunded':
      return 'Refunded'
    case 'withheld':
      return 'Withheld'
    default:
      return 'Unknown'
  }
}

export function resolveDepositAmount(input: {
  deposit_amount?: number | null
  deposit_held_rupees?: number | null
  vehicle_security_deposit?: number | null
}): number {
  const fromBooking = safeRupees(input.deposit_amount, -1)
  if (fromBooking > 0) return fromBooking
  const fromHeld = safeRupees(input.deposit_held_rupees, -1)
  if (fromHeld > 0) return fromHeld
  return safeRupees(input.vehicle_security_deposit, 0)
}

export function penaltyNotesFromJson(raw: unknown): Partial<Record<PenaltyCategory, string | null>> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Partial<Record<PenaltyCategory, string | null>> = {}
  for (const cat of PENALTY_CATEGORIES) {
    const v = (raw as Record<string, unknown>)[cat]
    if (typeof v === 'string') out[cat] = v
  }
  return out
}

export function penaltyNotesToJson(notes: Partial<Record<PenaltyCategory, string | null>>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(notes)) {
    const trimmed = v?.trim()
    if (trimmed) out[k] = trimmed
  }
  return out
}
