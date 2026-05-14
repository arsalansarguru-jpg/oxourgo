import { useMemo } from 'react'

import { computeBookingQuote } from '@/lib/booking/pricing'
import { validateTripWindow } from '@/lib/booking/dates'
import type { BookingQuote } from '@/lib/booking/types'
import { formatInr } from '@/lib/format'

export type BookingPricingLine = {
  label: string
  amount: number
  hint?: string
}

export type UseBookingPriceArgs = {
  pricePerDay: number
  pickup: string
  returnAt: string
}

export type UseBookingPriceResult = {
  dates: ReturnType<typeof validateTripWindow>
  quote: BookingQuote | null
  /** INR breakdown lines for summary / breakdown UI */
  pricingLines: BookingPricingLine[]
  /** True when dates validate and daily rate supports a quote */
  hasValidQuote: boolean
  subtotalLabel: string
}

/**
 * Live luxury booking math: subtotal (rate × days), concierge fee, GST (18%), total.
 * Recomputes whenever pickup or return changes.
 */
export function useBookingPrice({ pricePerDay, pickup, returnAt }: UseBookingPriceArgs): UseBookingPriceResult {
  const dates = useMemo(() => validateTripWindow(pickup, returnAt), [pickup, returnAt])
  const rentalDays = dates.ok ? dates.rentalDays : 0

  const quote = useMemo(() => {
    if (!dates.ok) return null
    const p = pricePerDay
    if (!Number.isFinite(p) || p <= 0) return null
    return computeBookingQuote(p, rentalDays)
  }, [dates.ok, rentalDays, pricePerDay])

  const pricingLines = useMemo((): BookingPricingLine[] => {
    if (!quote) return []
    return [
      {
        label: `Rental (${quote.rentalDays} ${quote.rentalDays === 1 ? 'day' : 'days'} × ${formatInr(pricePerDay)})`,
        amount: quote.subtotalRupees,
      },
      {
        label: 'Concierge fee',
        amount: quote.convenienceFeeRupees,
        hint: 'Transparent connectivity & handoff',
      },
      {
        label: 'GST (18%)',
        amount: quote.gstRupees,
        hint: 'On rental + concierge',
      },
    ]
  }, [quote, pricePerDay])

  const hasValidQuote = Boolean(dates.ok && quote)

  const subtotalLabel = quote
    ? `${quote.rentalDays} ${quote.rentalDays === 1 ? 'day' : 'days'} at ${formatInr(pricePerDay)} / day`
    : '—'

  return {
    dates,
    quote,
    pricingLines,
    hasValidQuote,
    subtotalLabel,
  }
}
