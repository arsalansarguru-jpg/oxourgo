'use client'

import Image from 'next/image'
import Link from 'next/link'

import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Section } from '@/components/ui/Section'
import {
  cardSurfaceBase,
  cardSurfaceHover,
  cardSurfaceTransition,
} from '@/components/ui/card-tokens'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import type { Car } from '@/types/car'

const panel =
  'rounded-2xl border border-stroke bg-carbon/55 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] backdrop-blur-xl sm:rounded-3xl sm:p-6'

export type BookingViewProps = {
  car: Car
  defaultPickupIso: string
  defaultReturnIso: string
  isLoggedIn: boolean
  userEmail: string | null
  onlineCheckoutAvailable: boolean
}

/**
 * Legacy checkout route UI — web booking is concierge-only.
 * Prefer redirect at route level; this remains as a safe fallback if rendered.
 */
export function BookingView({ car }: BookingViewProps) {
  return (
    <Section className="pt-10 pb-16">
      <div className={cn(panel, cardSurfaceBase, cardSurfaceTransition, cardSurfaceHover)}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <div className="relative mx-auto aspect-[16/10] w-full max-w-md overflow-hidden rounded-2xl border border-stroke bg-carbon-deep lg:mx-0 lg:w-[min(100%,26rem)] lg:shrink-0">
            <Image src={car.imageUrl} alt={car.name} fill className="object-cover" sizes="(max-width:1024px) 100vw, 400px" />
          </div>
          <div className="min-w-0 flex-1 space-y-5">
            <Badge variant="electric">Concierge booking</Badge>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-soft md:text-3xl">{car.name}</h1>
            <p className="text-sm leading-relaxed text-muted">
              Reservations are confirmed with our Mumbai concierge on WhatsApp — availability, paperwork, and pricing in
              one conversation.
            </p>
            <p className="text-xl font-semibold tabular-nums text-soft">
              From {formatInr(car.pricePerDay)}
              <span className="text-sm font-medium text-silver/90">/day</span>
            </p>
            <WhatsAppInquiryButton vehicle={{ vehicleName: car.name }} size="lg" className="w-full sm:w-auto" label="Book on WhatsApp" />
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" to={`/car/${car.id}`}>
              Vehicle details
            </Button>
            <p className="text-xs text-muted">
              <Link href="/fleet" className="font-medium text-electric underline-offset-4 hover:underline">
                Back to fleet
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}
