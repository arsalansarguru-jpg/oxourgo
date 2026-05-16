'use client'

import Link from 'next/link'
import { Fuel, Gauge, Users } from 'lucide-react'
import type { Car } from '@/types/car'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { Button } from '@/components/ui/Button'
import { FleetVehicleImg } from '@/components/fleet/fleet-vehicle-img'
import { ReviewBadge } from '@/components/marketing/review-badge'
import { Card, CardContent } from '@/components/ui/Card'
import { cardMetaChip, cardSurfaceBase, cardSurfaceHover, cardSurfaceTransition, cardTitle } from '@/components/ui/card-tokens'

type CarCardProps = {
  car: Car
  className?: string
  imageClassName?: string
}

export function CarCard({ car, className, imageClassName }: CarCardProps) {
  const available = car.status === 'Available'

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
      <Link href={`/car/${car.id}`} className={cn('relative block aspect-[16/10] overflow-hidden bg-carbon-deep', imageClassName)}>
        <FleetVehicleImg src={car.imageUrl} alt={car.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge variant={available ? 'success' : 'muted'}>{available ? 'Available' : 'Unavailable'}</Badge>
          <Badge variant="electric">{car.category}</Badge>
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div>
          <h3 className={cardTitle}>
            <Link href={`/car/${car.id}`} className="hover:text-silver">
              {car.name}
            </Link>
          </h3>
          <div className="mt-1.5">
            <ReviewBadge rating={car.rating} count={car.reviews} />
          </div>
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
            <WhatsAppInquiryButton vehicle={{ vehicleName: car.name }} size="md" className="w-full sm:w-auto" label="Inquire" />
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
