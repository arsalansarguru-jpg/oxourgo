import type { BookingWithCar } from '@/lib/supabase/database.types'

export const BOOKING_PAYMENT_STATUSES = ['pending', 'received', 'partial', 'refunded'] as const
export type BookingPaymentStatus = (typeof BOOKING_PAYMENT_STATUSES)[number]

export const BOOKING_PAYMENT_METHODS = ['pay_at_pickup', 'pay_online'] as const
export type BookingPaymentMethod = (typeof BOOKING_PAYMENT_METHODS)[number]

export function normalizePaymentStatus(raw: string): string {
  return raw.trim().toLowerCase()
}

/** Rental cash collected (excludes cancelled trips). */
export function collectedRentalRupees(booking: {
  booking_status: string
  payment_status: string
  amount_paid?: number
}): number {
  if (booking.booking_status.trim().toLowerCase() === 'cancelled') return 0
  const p = normalizePaymentStatus(booking.payment_status)
  if (p === 'received' || p === 'partial') return Math.max(0, Math.round(Number(booking.amount_paid ?? 0)))
  return 0
}

/** True when any rental amount has been collected (partial or full). */
export function isPostedRentalPayment(paymentStatus: string): boolean {
  const p = normalizePaymentStatus(paymentStatus)
  return p === 'received' || p === 'partial'
}

export function firstVehicle(row: BookingWithCar) {
  const v = row.vehicles
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

export type BookingPaymentBreakdown = {
  bookingTotalRupees: number
  securityDepositRupees: number
  pendingRentalRupees: number
  collectedRentalRupees: number
}

export function bookingPaymentBreakdown(row: BookingWithCar): BookingPaymentBreakdown {
  const total = Math.max(0, Math.round(Number(row.total_rupees ?? 0)))
  const veh = firstVehicle(row)
  const securityDepositRupees = Math.max(0, Math.round(Number(veh?.security_deposit ?? 0)))
  const collectedRentalRupees = Math.max(0, Math.round(Number(row.amount_paid ?? 0)))
  const pendingFromDb = Math.round(Number(row.amount_due ?? NaN))
  const pendingRentalRupees = Number.isFinite(pendingFromDb)
    ? Math.max(0, pendingFromDb)
    : Math.max(0, total - collectedRentalRupees)
  return {
    bookingTotalRupees: total,
    securityDepositRupees,
    pendingRentalRupees,
    collectedRentalRupees,
  }
}

export function formatPaymentMethodLabel(method: string | null | undefined): string {
  const m = (method ?? 'pay_at_pickup').trim().toLowerCase()
  if (m === 'pay_online') return 'Pay online'
  return 'Pay at pickup'
}

export function payAtPickupInstructions(): string[] {
  return [
    'Bring a valid driving licence and the card used for any pre-authorisation.',
    'Rental balance is collected at the hub before handover — UPI, NEFT, or card as arranged by concierge.',
    'Security deposit is a separate pre-auth at pickup; it is released after return inspection when eligible.',
  ]
}
