import 'server-only'

import { normalizePaymentStatus } from '@/lib/admin/status-enums'
import { safeRupees } from '@/lib/money/safe'

export type BookingFinancialRow = {
  booking_status?: string | null
  payment_status?: string | null
  total_rupees?: number | null
  amount_paid?: number | null
  amount_due?: number | null
}

const COLLECTED_STATUSES = new Set(['received', 'partial', 'paid', 'authorized', 'completed', 'succeeded'])

export function normalizePaymentStatusForAnalytics(raw: string | null | undefined): string {
  const s = (raw ?? '').trim().toLowerCase()
  if (s === 'paid' || s === 'authorized' || s === 'completed' || s === 'succeeded') return 'received'
  if (s === 'failed') return 'pending'
  return normalizePaymentStatus(raw)
}

export function isBookingCancelled(status: string | null | undefined): boolean {
  return (status ?? '').trim().toLowerCase() === 'cancelled'
}

/** Whole INR collected on the booking (posted payment status or any recorded amount_paid). */
export function bookingCollectedRupees(b: BookingFinancialRow): number {
  if (isBookingCancelled(b.booking_status)) return 0
  const paid = safeRupees(b.amount_paid)
  if (paid > 0) return paid
  const ps = normalizePaymentStatusForAnalytics(b.payment_status)
  if (!COLLECTED_STATUSES.has(ps)) return 0
  return paid
}

/** Outstanding rental balance (amount_due with total fallback). */
export function bookingPendingRupees(b: BookingFinancialRow): number {
  if (isBookingCancelled(b.booking_status)) return 0
  const due = safeRupees(b.amount_due, -1)
  if (due >= 0) return due
  const total = bookingContractRupees(b)
  const paid = bookingCollectedRupees(b)
  return Math.max(0, total - paid)
}

/** Contract value (gross rental) for non-cancelled bookings. */
export function bookingContractRupees(b: BookingFinancialRow): number {
  if (isBookingCancelled(b.booking_status)) return 0
  return safeRupees(b.total_rupees)
}

export function hasCollectedPayment(b: BookingFinancialRow): boolean {
  return bookingCollectedRupees(b) > 0
}
