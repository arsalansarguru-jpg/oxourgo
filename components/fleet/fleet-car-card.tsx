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
    <Card
      className={cn(
        'group/card flex h-full flex-col overflow-hidden',
        cardSurfaceBase,
        cardSurfaceTransition,
        cardSurfaceHover,
        className,
      )}
    >
      <Link href={detailHref} className="relative block aspect-[16/10] overflow-hidden bg-carbon-deep">
        <FleetVehicleImg src={car.imageUrl} alt={car.displayName} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge variant={available ? 'success' : 'muted'}>{car.availability}</Badge>
          {car.featured ? <Badge variant="electric">Featured</Badge> : null}
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div>
          <h3 className={cardTitle}>
            <Link href={detailHref} className="hover:text-silver">
              {car.displayName}
            </Link>
          </h3>
          <p className="mt-1.5 text-sm text-muted">
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
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-soft">
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
                pickupHub: tripPickup,
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
