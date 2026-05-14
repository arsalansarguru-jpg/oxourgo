import { Calendar, CreditCard, MapPin } from 'lucide-react'

import { VehicleCoverImage } from '@/components/fleet/vehicle-cover-image'

import type { BookingWithCar } from '@/lib/supabase/database.types'
import {
  CUSTOMER_BOOKING_STATUS_BADGE_VARIANT,
  customerBookingStatusLabel,
  formatPaymentStatusLabel,
  mapDbBookingStatusToCustomerBadge,
  paymentStatusBadgeVariant,
  resolveBookingVehicleVisual,
} from '@/lib/customer/booking-display'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cardSurfaceBase, cardSurfaceHover, cardSurfaceTransition } from '@/components/ui/card-tokens'

export type CustomerBookingFleetCardProps = {
  row: BookingWithCar
}

export function CustomerBookingFleetCard({ row }: CustomerBookingFleetCardProps) {
  const visual = resolveBookingVehicleVisual(row)
  const bookingBadge = mapDbBookingStatusToCustomerBadge(row.booking_status)
  const pay = row.payment_status.trim().toLowerCase()
  const needsPayment = row.booking_status === 'pending_payment' || pay === 'pending' || pay === 'failed'
  const pickupFmt = new Date(row.pickup_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  const returnFmt = new Date(row.return_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <article
      className={cn(
        cardSurfaceBase,
        cardSurfaceTransition,
        cardSurfaceHover,
        'overflow-hidden rounded-2xl border border-stroke shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] sm:rounded-3xl',
      )}
    >
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,160px)_1fr] lg:items-stretch lg:gap-8">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-stroke bg-matte/40 lg:aspect-auto lg:min-h-[140px]">
          <VehicleCoverImage
            src={visual.imageUrl}
            alt={visual.name}
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 200px"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/85">{visual.brand}</p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-soft sm:text-xl">{visual.name}</h3>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2 sm:gap-x-6">
              <div className="rounded-xl border border-stroke bg-matte/[0.35] px-3 py-2.5">
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <Calendar className="h-3.5 w-3.5 text-electric/80" aria-hidden />
                  Pickup
                </dt>
                <dd className="mt-1 font-medium leading-snug text-soft">{pickupFmt}</dd>
              </div>
              <div className="rounded-xl border border-stroke bg-matte/[0.35] px-3 py-2.5">
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <Calendar className="h-3.5 w-3.5 text-electric/80" aria-hidden />
                  Return
                </dt>
                <dd className="mt-1 font-medium leading-snug text-soft">{returnFmt}</dd>
              </div>
              <div className="rounded-xl border border-stroke bg-matte/[0.35] px-3 py-2.5 sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <MapPin className="h-3.5 w-3.5 text-electric/80" aria-hidden />
                  Route
                </dt>
                <dd className="mt-1 text-soft">
                  <span className="text-muted">{row.pickup_location}</span>
                  <span className="mx-2 text-muted/60">→</span>
                  <span className="text-muted">{row.return_location}</span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex shrink-0 flex-col gap-4 border-t border-stroke pt-4 lg:w-[min(100%,220px)] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Total</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-soft">{formatInr(row.total_rupees)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={CUSTOMER_BOOKING_STATUS_BADGE_VARIANT[bookingBadge]}>
                {customerBookingStatusLabel(bookingBadge)}
              </Badge>
              <Badge variant={paymentStatusBadgeVariant(row.payment_status)}>
                Pay: {formatPaymentStatusLabel(row.payment_status)}
              </Badge>
            </div>
            <Button className="w-full" variant="secondary" size="md" to={`/dashboard/bookings/${row.id}`}>
              View booking details
            </Button>
            {needsPayment ? (
              <Button className="w-full" size="md" to={`/dashboard/bookings/${row.id}`}>
                <CreditCard className="h-4 w-4" aria-hidden />
                Complete payment
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
