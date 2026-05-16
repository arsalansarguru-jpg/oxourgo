'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { FleetVehicleImg } from '@/components/fleet/fleet-vehicle-img'
import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { Button } from '@/components/ui/Button'
import type { FleetCar } from '@/lib/fleet/types'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

type FleetCarCardProps = {
  car: FleetCar
  className?: string
  tripFrom?: string
  tripTo?: string
  tripPickup?: string
}

function buildCarHref(carId: string, trip?: { from?: string; to?: string; pickup?: string }): string {
  const q = new URLSearchParams()
  if (trip?.from?.trim()) q.set('from', trip.from.trim())
  if (trip?.to?.trim()) q.set('to', trip.to.trim())
  if (trip?.pickup?.trim()) q.set('pickup', trip.pickup.trim())
  const s = q.toString()
  return s ? `/car/${carId}?${s}` : `/car/${carId}`
}

export function FleetCarCard({ car, className, tripFrom, tripTo, tripPickup }: FleetCarCardProps) {
  const detailHref = buildCarHref(car.id, { from: tripFrom, to: tripTo, pickup: tripPickup })
  const available = car.availability === 'Available'

  return (
    <article className={cn('group flex h-full flex-col', className)}>
      <Link
        href={detailHref}
        className={cn(
          'relative block overflow-hidden bg-carbon-deep',
          'aspect-[4/5] sm:aspect-[3/4]',
          'transition-opacity duration-500 hover:opacity-[0.92]',
        )}
      >
        <FleetVehicleImg
          src={car.imageUrl}
          alt={car.displayName}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-matte via-transparent to-transparent opacity-80" />
        <div className="absolute left-0 top-0 flex w-full items-start justify-between gap-3 p-4 sm:p-5">
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                'text-[10px] font-medium uppercase tracking-[0.22em]',
                available ? 'text-soft/90' : 'text-muted',
              )}
            >
              {car.availability}
            </span>
            {car.featured ? (
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-soft/70">Featured</span>
            ) : null}
          </div>
          <span
            className="text-[10px] font-medium uppercase tracking-[0.2em] text-soft/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
          >
            View
            <ArrowUpRight className="ml-1 inline h-3 w-3 align-middle" strokeWidth={2} />
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col pt-7 sm:pt-8">
        <h3 className="text-xl font-medium leading-snug tracking-[-0.03em] text-soft sm:text-[1.35rem]">
          <Link href={detailHref} className="transition-colors hover:text-silver">
            {car.displayName}
          </Link>
        </h3>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          <span>{car.category}</span>
          <span className="text-silver/50"> · </span>
          <span className="tabular-nums">{car.year}</span>
          {car.city?.trim() ? (
            <>
              <span className="text-silver/50"> · </span>
              <span>{car.city.trim()}</span>
            </>
          ) : null}
        </p>
        <p className="mt-5 text-[13px] leading-relaxed text-muted">
          {car.fuel}
          <span className="text-silver/45"> · </span>
          {car.transmission}
          <span className="text-silver/45"> · </span>
          {car.seats} seats
        </p>

        <div className="mt-auto flex flex-col gap-6 pt-10 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">From</p>
            <p className="mt-2 text-2xl font-medium tabular-nums tracking-[-0.03em] text-soft sm:text-[1.65rem]">
              {formatInr(car.pricePerDay)}
              <span className="text-base font-normal text-silver/80"> / day</span>
            </p>
          </div>
          {available ? (
            <WhatsAppInquiryButton
              vehicle={{
                vehicleName: car.displayName,
                tripFrom,
                tripTo,
                pickupHub: tripPickup,
              }}
              showIcon={false}
              variant="ghost"
              size="md"
              className={cn(
                'h-auto min-h-0 w-full justify-start rounded-none border-0 bg-transparent px-0 py-0 text-left shadow-none sm:w-auto sm:shrink-0',
                'text-[11px] font-medium uppercase tracking-[0.2em] text-soft',
                'hover:bg-transparent hover:opacity-60',
                'focus-visible:ring-0 focus-visible:ring-offset-0',
              )}
              label="WhatsApp"
            >
              <span className="flex items-center gap-2">
                Inquire
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60" strokeWidth={2} aria-hidden />
              </span>
            </WhatsAppInquiryButton>
          ) : (
            <Button
              size="md"
              variant="ghost"
              disabled
              className="h-auto min-h-0 cursor-not-allowed rounded-none border-0 px-0 py-0 text-[11px] font-medium uppercase tracking-[0.2em] text-muted opacity-50 shadow-none"
            >
              Unavailable
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
