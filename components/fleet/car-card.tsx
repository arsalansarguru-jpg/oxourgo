'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import type { Car } from '@/types/car'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { Button } from '@/components/ui/Button'
import { FleetVehicleImg } from '@/components/fleet/fleet-vehicle-img'
import { ReviewBadge } from '@/components/marketing/review-badge'

type CarCardProps = {
  car: Car
  className?: string
  imageClassName?: string
}

export function CarCard({ car, className, imageClassName }: CarCardProps) {
  const available = car.status === 'Available'

  return (
    <article className={cn('group flex h-full flex-col', className)}>
      <Link
        href={`/car/${car.id}`}
        className={cn(
          'relative block overflow-hidden bg-carbon-deep',
          'aspect-[4/5] sm:aspect-[3/4]',
          'transition-opacity duration-500 hover:opacity-[0.92]',
          imageClassName,
        )}
      >
        <FleetVehicleImg
          src={car.imageUrl}
          alt={car.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-matte via-transparent to-transparent opacity-80" />
        <div className="absolute left-0 top-0 flex w-full items-start justify-between gap-3 p-4 sm:p-5">
          <span
            className={cn(
              'text-[10px] font-medium uppercase tracking-[0.22em]',
              available ? 'text-soft/90' : 'text-muted',
            )}
          >
            {available ? 'Available' : 'Unavailable'}
          </span>
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
          <Link href={`/car/${car.id}`} className="transition-colors hover:text-silver">
            {car.name}
          </Link>
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 text-[13px] text-muted">
          <span>{car.category}</span>
          <ReviewBadge rating={car.rating} count={car.reviews} />
        </div>
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
              vehicle={{ vehicleName: car.name }}
              showIcon={false}
              variant="ghost"
              size="md"
              className={cn(
                'h-auto min-h-0 w-full justify-start rounded-none border-0 bg-transparent px-0 py-0 text-left shadow-none sm:w-auto',
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
