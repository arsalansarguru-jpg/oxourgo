'use client'

import { Phone } from 'lucide-react'

import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { Button } from '@/components/ui/Button'
import { cardEyebrow } from '@/components/ui/card-tokens'
import { BRAND } from '@/constants/brand'
import { PICKUP_HUB } from '@/lib/booking/constants'
import type { Car } from '@/types/car'

export type CarDetailInquiryPanelProps = {
  car: Car
  tripFrom?: string
  tripTo?: string
}

/** Inquiry-only booking panel — online checkout is paused; routes guests to concierge. */
export function CarDetailInquiryPanel({ car, tripFrom, tripTo }: CarDetailInquiryPanelProps) {
  const vehicle = {
    vehicleName: car.name,
    tripFrom,
    tripTo,
  }

  return (
    <section className="space-y-5" aria-labelledby="inquiry-heading">
      <div>
        <p className={cardEyebrow}>Concierge booking</p>
        <h2 id="inquiry-heading" className="mt-1 text-xl font-semibold tracking-[-0.03em] text-soft">
          Book on WhatsApp
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Our concierge confirms availability, dates, and documents over WhatsApp — typically within minutes during service
          hours.
        </p>
      </div>

      <div className="rounded-xl border border-stroke bg-fill-glass px-4 py-3 text-sm text-muted">
        <p>
          Pickup: <span className="font-semibold text-soft">{PICKUP_HUB}</span>
        </p>
        {tripFrom && tripTo ? (
          <p className="mt-1">
            Dates:{' '}
            <span className="font-semibold text-soft">
              {tripFrom} → {tripTo}
            </span>
          </p>
        ) : null}
      </div>

      <WhatsAppInquiryButton vehicle={vehicle} size="lg" className="w-full min-h-[3.25rem] sm:min-h-[3.125rem]" label="Book on WhatsApp" />

      <Button size="lg" variant="secondary" className="w-full min-h-[3.25rem] gap-2 sm:min-h-[3.125rem]" href={`tel:${BRAND.phoneTel}`}>
        <Phone className="h-4 w-4 shrink-0" aria-hidden />
        Call {BRAND.phoneDisplay}
      </Button>

      <p className="text-center text-xs leading-relaxed text-silver">
        Prefer email?{' '}
        <a href={`mailto:${BRAND.email}`} className="text-electric hover:underline">
          {BRAND.email}
        </a>
      </p>
    </section>
  )
}
