'use client'

import { motion } from 'framer-motion'
import { Fuel, Gauge, Users } from 'lucide-react'

import { cardLiftSpring } from '@/animations/presets'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cardMetaChip, cardSurfaceHoverAccent, cardTitle } from '@/components/ui/card-tokens'
import type { FleetCar } from '@/lib/fleet/types'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

type FleetCarCardProps = {
  car: FleetCar
  className?: string
}

export function FleetCarCard({ car, className }: FleetCarCardProps) {
  const available = car.availability === 'Available'

  return (
    <motion.div whileHover={{ y: -5 }} transition={cardLiftSpring} className={cn('h-full', className)}>
      <Card className={cn('group/card flex h-full flex-col overflow-hidden', cardSurfaceHoverAccent)}>
        <div className="relative aspect-[16/10] overflow-hidden bg-carbon-deep">
          {/* eslint-disable-next-line @next/next/no-img-element -- fleet image URLs come from Supabase (storage or any HTTPS) */}
          <img
            src={car.imageUrl}
            alt={car.displayName}
            className="absolute inset-0 h-full w-full object-cover transition-[transform] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.035]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-matte/92 via-matte/[0.12] to-transparent" />
          <div className="absolute left-3 top-3 z-[1] flex flex-wrap gap-2 sm:left-4 sm:top-4">
            <Badge variant={available ? 'success' : 'muted'}>{car.availability}</Badge>
            {car.featured ? <Badge variant="electric">Featured</Badge> : null}
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col gap-5">
          <div>
            <h3 className={cardTitle}>{car.displayName}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <Badge variant="electric" className="font-medium">
                {car.category}
              </Badge>
              <span className="tabular-nums text-muted">{car.year}</span>
              {car.city?.trim() ? (
                <span className="text-muted">· {car.city.trim()}</span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <span className={cn(cardMetaChip, 'tabular-nums')}>
              <Fuel className="h-3.5 w-3.5 shrink-0 text-electric/90" />
              {car.fuel}
            </span>
            <span className={cn(cardMetaChip, 'tabular-nums')}>
              <Gauge className="h-3.5 w-3.5 shrink-0 text-electric/90" />
              {car.transmission}
            </span>
            <span className={cn(cardMetaChip, 'tabular-nums')}>
              <Users className="h-3.5 w-3.5 shrink-0 text-electric/90" />
              {car.seats} seats
            </span>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">From</p>
              <p className="text-xl font-bold tracking-[-0.02em] text-soft">
                {formatInr(car.pricePerDay)}
                <span className="text-sm font-medium text-silver/90">/day</span>
              </p>
            </div>
            {available ? (
              <Button size="md" to={`/car/${car.id}`}>
                Book
              </Button>
            ) : (
              <Button size="md" variant="secondary" disabled>
                Unavailable
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
