'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { CalendarRange, Shield } from 'lucide-react'

import type { BookingPricingLine } from '@/hooks/use-booking-price'
import type { BookingQuote } from '@/lib/booking/types'
import { formatTripDateTime } from '@/lib/booking/format-trip'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import { PricingBreakdown } from '@/components/booking/pricing-breakdown'
import { BookingPricingSkeleton } from '@/components/booking/booking-pricing-skeleton'
import { cardEyebrow } from '@/components/ui/card-tokens'

type Props = {
  vehicleName: string
  vehicleImageUrl: string
  pickup: string
  returnAt: string
  /** Billable rental days when dates are valid; pass `null` when invalid */
  rentalDays: number | null
  showPricing: boolean
  /** While calendar availability is rechecking, keep a polished skeleton over totals */
  pricingLoading?: boolean
  pricingLines: BookingPricingLine[]
  quote: BookingQuote | null
  securityDeposit: number
  /** Shown when pricing is hidden and not in a loading state */
  pricingHint?: string
  className?: string
}

export function BookingSummaryCard({
  vehicleName,
  vehicleImageUrl,
  pickup,
  returnAt,
  rentalDays,
  showPricing,
  pricingLoading = false,
  pricingLines,
  quote,
  securityDeposit,
  pricingHint = 'Adjust your trip window to see a live estimate.',
  className,
}: Props) {
  const daysLabel =
    rentalDays == null ? '—' : `${rentalDays} ${rentalDays === 1 ? 'rental day' : 'rental days'}`

  const pricingBlock =
    pricingLoading && quote ? (
      <BookingPricingSkeleton />
    ) : showPricing && quote ? (
      <motion.div
        key={quote.totalRupees}
        initial={{ opacity: 0.65 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28 }}
      >
        <PricingBreakdown lines={pricingLines} totalRupees={quote.totalRupees} eyebrow="Estimated total" />
      </motion.div>
    ) : pricingLoading ? (
      <BookingPricingSkeleton />
    ) : (
      <p className="rounded-xl border border-dashed border-stroke/80 bg-matte/[0.2] px-3 py-4 text-center text-sm leading-relaxed text-muted">
        {pricingHint}
      </p>
    )
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'overflow-hidden rounded-2xl border border-stroke bg-gradient-to-br from-carbon/80 via-matte/[0.65] to-carbon/55 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,var(--shadow-card)] backdrop-blur-xl',
        className,
      )}
    >
      <div className="border-b border-stroke/80 bg-fill-glass-strong/30 px-4 py-3.5 sm:px-5 sm:py-4">
        <p className={cardEyebrow}>Booking summary</p>
        <div className="mt-3 flex gap-3">
          <div className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-stroke bg-carbon-deep sm:h-16 sm:w-24">
            <Image
              src={vehicleImageUrl}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="96px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-[-0.02em] text-soft sm:text-base">{vehicleName}</p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              <CalendarRange className="h-3.5 w-3.5 shrink-0 text-electric/90" aria-hidden />
              <span className="tabular-nums text-soft">{daysLabel}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid gap-2.5 text-xs leading-relaxed text-muted sm:text-sm">
          <div className="flex flex-col gap-0.5 rounded-xl border border-stroke/60 bg-matte/[0.25] px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <span className="shrink-0 font-medium text-silver">Pickup</span>
            <span className="min-w-0 text-right text-soft">{formatTripDateTime(pickup)}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl border border-stroke/60 bg-matte/[0.25] px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <span className="shrink-0 font-medium text-silver">Return</span>
            <span className="min-w-0 text-right text-soft">{formatTripDateTime(returnAt)}</span>
          </div>
        </div>

        <div className="pt-1">{pricingBlock}</div>

        <div className="flex items-start gap-2.5 rounded-xl border border-stroke/70 bg-matte/[0.3] px-3 py-3 text-xs leading-relaxed text-muted sm:text-sm">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-electric/90" aria-hidden />
          <div className="min-w-0">
            <p className="font-medium text-soft">Refundable deposit</p>
            {securityDeposit <= 0 ? (
              <p className="mt-1 text-muted">No security deposit for this vehicle.</p>
            ) : (
              <p className="mt-1">
                <span className="font-semibold text-soft">{formatInr(securityDeposit)}</span> pre-authorization at
                handoff. Released after a successful return inspection.
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
