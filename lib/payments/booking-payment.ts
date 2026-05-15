import type { BookingWithCar } from '@/lib/supabase/database.types'
import type { PaymentCheckoutStatus } from '@/lib/payments/types'

export const BOOKING_PAYMENT_STATUSES = ['pending', 'received', 'partial', 'refunded'] as const
export type BookingPaymentStatus = (typeof BOOKING_PAYMENT_STATUSES)[number]

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

export function normalizeCheckoutStatus(raw: string | null | undefined): PaymentCheckoutStatus {
  const s = (raw ?? 'not_started').trim().toLowerCase()
  const allowed: PaymentCheckoutStatus[] = [
    'not_started',
    'order_created',
    'authorized',
    'captured',
    'failed',
    'refunded',
  ]
  return (allowed as readonly string[]).includes(s) ? (s as PaymentCheckoutStatus) : 'not_started'
}

/** @deprecated Import from `@/lib/payments` or `@/lib/payments/methods` */
export {
  formatPaymentMethodLabel,
  payAtPickupInstructions,
  onlinePaymentInstructions,
  isOnlinePaymentMethod,
  normalizeBookingPaymentMethod,
  BOOKING_PAYMENT_METHODS,
} from '@/lib/payments/methods'
export type { BookingPaymentMethod } from '@/lib/payments/methods'
