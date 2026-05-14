import type { BookingQuote } from '@/lib/booking/types'

/** Concierge & connectivity fee — 4% of rental subtotal (transparent line item). */
export const BOOKING_CONCIERGE_FEE_RATE = 0.04

/** GST on rental + concierge (India standard slab for this product surface). */
export const BOOKING_GST_RATE = 0.18

/**
 * subtotal = daily_rate × rental_days
 * concierge fee = BOOKING_CONCIERGE_FEE_RATE × subtotal
 * GST = BOOKING_GST_RATE × (subtotal + concierge)
 * total = subtotal + concierge + GST
 */
export function computeBookingQuote(pricePerDayRupees: number, rentalDays: number): BookingQuote {
  const safeDays = Math.max(1, Math.min(60, rentalDays))
  const subtotalRupees = Math.round(pricePerDayRupees * safeDays)
  const convenienceFeeRupees = Math.round(subtotalRupees * BOOKING_CONCIERGE_FEE_RATE)
  const gstRupees = Math.round((subtotalRupees + convenienceFeeRupees) * BOOKING_GST_RATE)
  const totalRupees = subtotalRupees + convenienceFeeRupees + gstRupees
  return {
    rentalDays: safeDays,
    subtotalRupees,
    convenienceFeeRupees,
    gstRupees,
    totalRupees,
  }
}
