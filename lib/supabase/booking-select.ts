import { safeRupees } from '@/lib/money/safe'

/**
 * Single source of truth for PostgREST booking selects.
 * Tiered fallbacks allow admin lists to load when production schema lags migrations.
 */

export const BOOKING_VEHICLE_EMBED = `
  vehicles!bookings_vehicle_id_fkey (
    id,
    name,
    brand,
    price_per_day,
    image,
    available,
    transmission,
    fuel_type,
    seats,
    year,
    registration_number,
    security_deposit
  )
`

/** Guaranteed on any Oxour booking row after date/vehicle renames. */
export const BOOKING_SELECT_MINIMAL = `
  id,
  vehicle_id,
  user_id,
  pickup_date,
  return_date,
  pickup_location,
  return_location,
  rental_days,
  subtotal_rupees,
  total_rupees,
  booking_status,
  payment_status,
  created_at,
  updated_at
`.trim()

/** Payment ops columns (20260601100000) — excludes optional enterprise fields. */
export const BOOKING_SELECT_OPERATIONAL = `
  ${BOOKING_SELECT_MINIMAL},
  price_per_day_rupees_snapshot,
  convenience_fee_rupees,
  gst_rupees,
  payment_method,
  amount_due,
  amount_paid,
  payment_received_at,
  payment_received_by,
  payment_notes,
  ops_note,
  deposit_amount,
  deposit_status,
  booking_source
`.trim()

/** Full admin/detail surface (requires later migrations applied). */
export const BOOKING_SELECT_FULL = `
  ${BOOKING_SELECT_OPERATIONAL},
  approved_at,
  handed_over_at,
  returned_at,
  completed_at,
  approved_by,
  handed_over_by,
  completed_by,
  deposit_held_rupees,
  deposit_refunded_at,
  deposit_refunded_rupees,
  deposit_received_at,
  refund_amount,
  refund_processed_at,
  penalty_total,
  penalty_fuel_rupees,
  penalty_cleaning_rupees,
  penalty_traffic_rupees,
  penalty_notes,
  deductions,
  financial_manual_override,
  pickup_checklist,
  return_checklist,
  pickup_fuel_level,
  return_fuel_level,
  pickup_odometer_km,
  return_odometer_km,
  pickup_condition_notes,
  return_condition_notes,
  penalty_damage_rupees,
  penalty_late_rupees,
  penalty_extra_km_rupees,
  deposit_penalty_total_rupees,
  customer_handover_signature_path,
  customer_handover_signed_at,
  pickup_inspection_completed_at,
  return_inspection_completed_at,
  admin_internal_notes,
  ops_hold_at,
  ops_hold_reason,
  vip_flag,
  customer_flags,
  restrictions_bypass,
  custom_discount_rupees,
  customer_contact_id,
  whatsapp_conversation_id,
  outstanding_fines_rupees,
  ${BOOKING_VEHICLE_EMBED}
`.trim()

/** Progressive select tiers (widest first). */
export const BOOKING_SELECT_TIERS = [BOOKING_SELECT_FULL, BOOKING_SELECT_OPERATIONAL, BOOKING_SELECT_MINIMAL] as const

export type BookingRowLike = Record<string, unknown> & {
  id: string
  user_id: string
  vehicle_id?: string | null
  payment_method?: string | null
  payment_status?: string | null
  amount_due?: number | null
  amount_paid?: number | null
  booking_status?: string | null
  total_rupees?: number | null
}

/** Apply defaults when a tier omits columns missing in production. */
export function normalizeBookingRow<T extends BookingRowLike>(row: T): T & {
  payment_method: string
  amount_due: number
  amount_paid: number
} {
  const total = safeRupees(row.total_rupees)
  const paid = safeRupees(row.amount_paid)
  const due =
    row.amount_due != null ? safeRupees(row.amount_due) : Math.max(0, total - paid)

  return {
    ...row,
    payment_method: (row.payment_method as string | null)?.trim() || 'pay_at_pickup',
    amount_paid: paid,
    amount_due: due,
    payment_status: (row.payment_status as string | null)?.trim() || 'pending',
    booking_status: (row.booking_status as string | null)?.trim() || 'pending_payment',
  }
}
