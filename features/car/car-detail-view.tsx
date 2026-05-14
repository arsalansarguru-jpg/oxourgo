'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Shield } from 'lucide-react'

import { FleetVehicleImg } from '@/components/fleet/fleet-vehicle-img'
import { VehicleCoverImage } from '@/components/fleet/vehicle-cover-image'
import type { Car } from '@/types/car'
import { carDetailFaqs } from '@/data/faqs'
import { carReviews } from '@/data/reviews'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import {
  cardEyebrow,
  cardSurfaceBase,
  cardSurfaceHover,
  cardSurfaceTransition,
} from '@/components/ui/card-tokens'
import { CarDetailBookingPanel } from '@/components/car/car-detail-booking-panel'
import { ReviewBadge } from '@/components/marketing/review-badge'

type CarDetailViewProps = {
  car: Car
  isLoggedIn: boolean
  kycApproved: boolean
  kycStatus?: string | null
}

export function CarDetailView({ car, isLoggedIn, kycApproved, kycStatus }: CarDetailViewProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [openFaq, setOpenFaq] = useState<string | null>(carDetailFaqs[0]?.id ?? null)
  const bookingAnchorRef = useRef<HTMLDivElement>(null)

  const reviews = useMemo(() => carReviews.filter((r) => r.carId === car.id), [car.id])

  const scrollToBooking = () => {
    bookingAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Section className="pt-8">
      <article className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="min-w-0">
          <div
            className={cn(
              'overflow-hidden',
              cardSurfaceBase,
              cardSurfaceTransition,
              cardSurfaceHover,
            )}
          >
            <div className="relative aspect-[16/10]">
              <VehicleCoverImage
                src={car.gallery[activeImage] ?? car.imageUrl}
                alt={car.name}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 65vw"
                priority
              />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <Badge variant={car.status === 'Available' ? 'success' : 'muted'}>
                  {car.status}
                </Badge>
                <Badge variant="electric">{car.category}</Badge>
              </div>
            </div>
            <div className="scroll-touch flex snap-x snap-mandatory gap-2 overflow-x-auto p-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {car.gallery.map((src, idx) => (
                <button
                  key={`gallery-${idx}`}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    'relative h-[4.25rem] w-[6.75rem] shrink-0 snap-start overflow-hidden rounded-xl border transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/50 focus-visible:ring-offset-2 focus-visible:ring-offset-matte sm:h-16 sm:w-24',
                    idx === activeImage
                      ? 'border-electric/60 ring-2 ring-electric/30'
                      : 'border-stroke hover:border-stroke-strong hover:-translate-y-0.5',
                  )}
                >
                  <FleetVehicleImg
                    src={src}
                    alt=""
                    variant="thumbnail"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 min-w-0 space-y-4">
            <h1 className="text-2xl font-bold tracking-tight text-soft sm:text-3xl md:text-4xl">{car.name}</h1>
            <p className="max-w-2xl text-silver leading-relaxed">{car.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-silver">
              <ReviewBadge rating={car.rating} count={car.reviews} className="text-sm" />
              <span aria-hidden className="text-silver/50">
                ·
              </span>
              <span>
                {car.fuel} · {car.transmission} · {car.seats} seats
              </span>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Card className={cn(cardSurfaceHover)}>
              <CardContent>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">Specifications</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  {Object.entries(car.specs).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between gap-4 border-b border-stroke pb-2 last:border-0"
                    >
                      <dt className="text-silver">{k}</dt>
                      <dd className="text-right font-medium text-soft">{v}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <Card className={cn(cardSurfaceHover)}>
              <CardContent>
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-[-0.02em] text-soft">
                  <Shield className="h-5 w-5 text-electric" />
                  Security deposit
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-silver">
                  {car.securityDeposit <= 0 ? (
                    <>No security deposit is required for this vehicle at handoff.</>
                  ) : (
                    <>
                      A refundable pre-authorization of{' '}
                      <span className="font-semibold text-soft">{formatInr(car.securityDeposit)}</span> is held at
                      pickup. Released after a successful return inspection—typically 5–7 banking days.
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-semibold text-soft">Frequently asked</h2>
            <div
              className={cn(
                'mt-4 divide-y divide-stroke',
                cardSurfaceBase,
                cardSurfaceTransition,
                'bg-matte/[0.35]',
              )}
            >
              {carDetailFaqs.map((faq) => {
                const open = openFaq === faq.id
                return (
                  <div key={faq.id} className="px-4">
                    <button
                      type="button"
                      className="flex min-h-12 w-full touch-manipulation items-center justify-between gap-4 py-4 text-left"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : faq.id)}
                    >
                      <span className="font-medium text-soft">{faq.question}</span>
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 shrink-0 text-silver transition-transform duration-300 ease-out',
                          open && 'rotate-180',
                        )}
                      />
                    </button>
                    <div
                      className={cn(
                        'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                      )}
                    >
                      <div className="overflow-hidden">
                        <p className="pb-4 text-sm leading-relaxed text-silver">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-semibold text-soft">Recent reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-stroke bg-matte/[0.35] px-5 py-8 text-center text-sm leading-relaxed text-muted">
                Be the first to review this vehicle after your trip.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {reviews.map((r) => (
                  <Card key={r.id} className={cn(cardSurfaceHover)}>
                    <CardContent>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-soft">{r.author}</p>
                        <span className="text-xs text-electric">{r.rating.toFixed(1)} ★</span>
                      </div>
                      <p className="mt-1 text-xs text-silver">{r.role}</p>
                      <p className="mt-3 text-sm leading-relaxed text-silver">{r.text}</p>
                      <p className="mt-3 text-xs text-silver/70">{r.date}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div
            ref={bookingAnchorRef}
            id="vehicle-reserve"
            className="glass-panel scroll-mt-[calc(var(--public-header-offset)+0.75rem)] space-y-5 rounded-[1.25rem] border border-stroke p-5 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6 lg:scroll-mt-28"
          >
            <div>
              <p className={cardEyebrow}>From per day</p>
              <p className="mt-1 text-3xl font-bold text-soft">{formatInr(car.pricePerDay)}</p>
              <p className="mt-2 text-xs text-silver">
                Days and total update from your pickup and return times.
              </p>
            </div>

            <CarDetailBookingPanel car={car} isLoggedIn={isLoggedIn} kycApproved={kycApproved} kycStatus={kycStatus} />

            <Button size="lg" variant="secondary" className="w-full" to="/fleet">
              Back to fleet
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-silver">
            Need a human?{' '}
            <Link href="/support" className="text-electric hover:underline">
              Concierge support
            </Link>
          </p>
        </aside>
      </article>

      <div
        className="pointer-events-none fixed inset-x-0 z-[48] lg:hidden"
        style={{ bottom: 'var(--mobile-fab-clearance)' }}
        role="region"
        aria-label="Reserve this vehicle"
      >
        <div className="pointer-events-auto mx-auto max-w-lg px-[var(--spacing-edge)]">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-stroke bg-matte/[0.94] px-4 py-3 shadow-[0_-12px_48px_-20px_rgba(0,0,0,0.72)] backdrop-blur-2xl supports-[backdrop-filter]:bg-matte/80">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">From / day</p>
              <p className="truncate text-lg font-bold tabular-nums text-soft">{formatInr(car.pricePerDay)}</p>
            </div>
            <Button type="button" size="lg" className="shrink-0 touch-manipulation" onClick={scrollToBooking}>
              Reserve
            </Button>
          </div>
        </div>
      </div>
    </Section>
  )
}
