'use client'

import Link from 'next/link'
import { Fuel, Gauge, Users } from 'lucide-react'

import { FleetVehicleImg } from '@/components/fleet/fleet-vehicle-img'
import { Badge } from '@/components/ui/Badge'
import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cardMetaChip, cardSurfaceBase, cardSurfaceHover, cardSurfaceTransition, cardTitle } from '@/components/ui/card-tokens'
import type { FleetCar } from '@/lib/fleet/types'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

type FleetCarCardProps = {
  car: FleetCar
  className?: string
  tripFrom?: string
  tripTo?: string
}

function buildCarHref(carId: string, trip?: { from?: string; to?: string }): string {
  const q = new URLSearchParams()
  if (trip?.from?.trim()) q.set('from', trip.from.trim())
  if (trip?.to?.trim()) q.set('to', trip.to.trim())
  const s = q.toString()
  return s ? `/car/${carId}?${s}` : `/car/${carId}`
}

export function FleetCarCard({ car, className, tripFrom, tripTo }: FleetCarCardProps) {
  const detailHref = buildCarHref(car.id, { from: tripFrom, to: tripTo })
  const available = car.availability === 'Available'

  return (
    <Card
      className={cn(
        'group/card flex h-full flex-col overflow-hidden bg-carbon/92',
        cardSurfaceBase,
        cardSurfaceTransition,
        cardSurfaceHover,
        className,
      )}
    >
      <Link href={detailHref} className="relative block aspect-[16/10] overflow-hidden bg-[#14100b]">
        <FleetVehicleImg
          src={car.imageUrl}
          alt={car.displayName}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.58))]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge variant={available ? 'success' : 'muted'}>{car.availability}</Badge>
          {car.featured ? <Badge variant="electric">Featured</Badge> : null}
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="min-w-0">
          <h3 className={cardTitle}>
            <Link href={detailHref} className="line-clamp-2 break-words hover:text-silver">
              {car.displayName}
            </Link>
          </h3>
          <p className="mt-1.5 text-xs text-muted sm:text-sm">
            {car.category} · {car.year}
            {car.city?.trim() ? ` · ${car.city.trim()}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={cardMetaChip}>
            <Fuel className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {car.fuel}
          </span>
          <span className={cardMetaChip}>
            <Gauge className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {car.transmission}
          </span>
          <span className={cardMetaChip}>
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {car.seats} seats
          </span>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-stroke pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">From</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-soft sm:text-2xl">
              {formatInr(car.pricePerDay)}
              <span className="text-sm font-normal text-muted"> / day</span>
            </p>
          </div>
          {available ? (
            <WhatsAppInquiryButton
              vehicle={{
                vehicleName: car.displayName,
                tripFrom,
                tripTo,
              }}
              size="md"
              className="w-full sm:w-auto"
              label="Inquire"
            />
          ) : (
            <Button size="md" variant="secondary" disabled className="w-full sm:w-auto">
              Unavailable
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
