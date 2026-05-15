/** Traffic fines & violation model — shared by admin and customer views. */

export const VIOLATION_TYPES = [
  'traffic_challan',
  'speeding_fine',
  'toll_violation',
  'parking_penalty',
  'towing_charge',
  'damage_liability',
] as const

export type ViolationType = (typeof VIOLATION_TYPES)[number]

export const VIOLATION_TYPE_LABELS: Record<ViolationType, string> = {
  traffic_challan: 'Traffic challan',
  speeding_fine: 'Speeding fine',
  toll_violation: 'Toll violation',
  parking_penalty: 'Parking penalty',
  towing_charge: 'Towing charge',
  damage_liability: 'Damage liability',
}

export const VIOLATION_STATUSES = [
  'pending',
  'customer_notified',
  'paid',
  'deducted_from_deposit',
  'disputed',
] as const

export type ViolationStatus = (typeof VIOLATION_STATUSES)[number]

export const VIOLATION_STATUS_LABELS: Record<ViolationStatus, string> = {
  pending: 'Pending',
  customer_notified: 'Customer notified',
  paid: 'Paid',
  deducted_from_deposit: 'Deducted from deposit',
  disputed: 'Disputed',
}

export const OUTSTANDING_VIOLATION_STATUSES: ViolationStatus[] = [
  'pending',
  'customer_notified',
  'disputed',
]

export const SETTLED_VIOLATION_STATUSES: ViolationStatus[] = ['paid', 'deducted_from_deposit']

export type ViolationRow = {
  id: string
  booking_id: string
  user_id: string
  violation_type: ViolationType | string
  amount_rupees: number
  reason: string
  violation_date: string
  authority_source: string | null
  notes: string | null
  status: ViolationStatus | string
  challan_storage_path: string | null
  challan_mime: string | null
  challan_file_name: string | null
  amount_paid_rupees: number
  amount_deducted_rupees: number
  customer_notified_at: string | null
  paid_at: string | null
  deducted_at: string | null
  resolved_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ViolationEventRow = {
  id: string
  violation_id: string
  booking_id: string
  event_type: string
  payload: Record<string, unknown>
  actor_user_id: string | null
  created_at: string
}

export function violationTypeLabel(type: string | null | undefined): string {
  const t = (type ?? '').trim() as ViolationType
  return VIOLATION_TYPE_LABELS[t] ?? type?.replace(/_/g, ' ') ?? 'Violation'
}

export function violationStatusLabel(status: string | null | undefined): string {
  const s = (status ?? '').trim() as ViolationStatus
  return VIOLATION_STATUS_LABELS[s] ?? status?.replace(/_/g, ' ') ?? 'Unknown'
}

export function isOutstandingViolation(status: string): boolean {
  return (OUTSTANDING_VIOLATION_STATUSES as readonly string[]).includes(status)
}

export function sumViolationAmounts(rows: Pick<ViolationRow, 'amount_rupees' | 'status'>[]): {
  totalLiabilityRupees: number
  outstandingRupees: number
  collectedRupees: number
} {
  let totalLiabilityRupees = 0
  let outstandingRupees = 0
  let collectedRupees = 0

  for (const row of rows) {
    const amt = Math.max(0, Math.round(row.amount_rupees ?? 0))
    if (row.status === 'disputed') {
      outstandingRupees += amt
      continue
    }
    totalLiabilityRupees += amt
    if (isOutstandingViolation(row.status)) {
      outstandingRupees += amt
    }
    if (row.status === 'paid' || row.status === 'deducted_from_deposit') {
      collectedRupees += amt
    }
  }

  return { totalLiabilityRupees, outstandingRupees, collectedRupees }
}

export function violationsByTypeCounts(
  rows: Pick<ViolationRow, 'violation_type' | 'amount_rupees'>[],
): Array<{ type: ViolationType; label: string; count: number; totalRupees: number }> {
  const map = new Map<ViolationType, { count: number; totalRupees: number }>()
  for (const row of rows) {
    const t = row.violation_type as ViolationType
    if (!(VIOLATION_TYPES as readonly string[]).includes(t)) continue
    const prev = map.get(t) ?? { count: 0, totalRupees: 0 }
    map.set(t, {
      count: prev.count + 1,
      totalRupees: prev.totalRupees + Math.max(0, Math.round(row.amount_rupees ?? 0)),
    })
  }
  return [...map.entries()]
    .map(([type, stats]) => ({
      type,
      label: VIOLATION_TYPE_LABELS[type],
      count: stats.count,
      totalRupees: stats.totalRupees,
    }))
    .sort((a, b) => b.count - a.count)
}
