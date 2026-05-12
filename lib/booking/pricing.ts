import type { BookingQuote } from '@/lib/booking/types'

/** Matches concierge + GST model used on car detail. */
export function computeBookingQuote(pricePerDayRupees: number, rentalDays: number): BookingQuote {
  const safeDays = Math.max(1, Math.min(60, rentalDays))
  const subtotalRupees = Math.round(pricePerDayRupees * safeDays)
  const convenienceFeeRupees = Math.round(subtotalRupees * 0.04)
  const gstRupees = Math.round((subtotalRupees + convenienceFeeRupees) * 0.18)
  const totalRupees = subtotalRupees + convenienceFeeRupees + gstRupees
  return {
    rentalDays: safeDays,
    subtotalRupees,
    convenienceFeeRupees,
    gstRupees,
    totalRupees,
  }
}
