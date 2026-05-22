import { safeRupees } from '@/lib/money/safe'
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
  if (p === 'received' || p === 'partial' || p === 'paid' || p === 'authorized' || p === 'completed' || p === 'succeeded') {
    return safeRupees(booking.amount_paid)
  }
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
  const total = safeRupees(row.total_rupees)
  const veh = firstVehicle(row)
  const bookingDeposit = safeRupees(
    (row as { deposit_amount?: number | null }).deposit_amount ??
      (row as { deposit_held_rupees?: number | null }).deposit_held_rupees,
    -1,
  )
  const securityDepositRupees =
    bookingDeposit > 0 ? bookingDeposit : safeRupees(veh?.security_deposit)
  const collected = collectedRentalRupees(row)
  const pendingFromDb = safeRupees(row.amount_due, -1)
  const pendingRentalRupees =
    pendingFromDb >= 0 ? pendingFromDb : Math.max(0, total - collected)
  return {
    bookingTotalRupees: total,
    securityDepositRupees,
    pendingRentalRupees,
    collectedRentalRupees: collected,
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
