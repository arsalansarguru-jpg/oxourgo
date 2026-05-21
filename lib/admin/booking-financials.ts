import 'server-only'

import { normalizePaymentStatus } from '@/lib/admin/status-enums'

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

/** Whole INR collected on the booking (uses amount_paid when status indicates collection). */
export function bookingCollectedRupees(b: BookingFinancialRow): number {
  if (isBookingCancelled(b.booking_status)) return 0
  const paid = Math.max(0, Math.round(Number(b.amount_paid ?? 0)))
  const ps = normalizePaymentStatusForAnalytics(b.payment_status)
  if (COLLECTED_STATUSES.has(ps) || paid > 0) return paid
  return 0
}

/** Outstanding rental balance (amount_due with total fallback). */
export function bookingPendingRupees(b: BookingFinancialRow): number {
  if (isBookingCancelled(b.booking_status)) return 0
  const due = b.amount_due
  if (due != null && Number.isFinite(Number(due))) return Math.max(0, Math.round(Number(due)))
  const total = Math.max(0, Math.round(Number(b.total_rupees ?? 0)))
  const paid = bookingCollectedRupees(b)
  return Math.max(0, total - paid)
}

/** Contract value (gross rental) for non-cancelled bookings. */
export function bookingContractRupees(b: BookingFinancialRow): number {
  if (isBookingCancelled(b.booking_status)) return 0
  return Math.max(0, Math.round(Number(b.total_rupees ?? 0)))
}

export function hasCollectedPayment(b: BookingFinancialRow): boolean {
  return bookingCollectedRupees(b) > 0
}
