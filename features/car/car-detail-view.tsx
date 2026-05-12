'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, ChevronDown, Shield, Star } from 'lucide-react'
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
  cardPaddingCompact,
  cardSurfaceBase,
  cardSurfaceHover,
  cardSurfaceTransition,
} from '@/components/ui/card-tokens'
import { PricingBreakdown } from '@/components/booking/pricing-breakdown'
type CarDetailViewProps = {
  car: Car
}

export function CarDetailView({ car }: CarDetailViewProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [days, setDays] = useState(2)
  const [openFaq, setOpenFaq] = useState<string | null>(carDetailFaqs[0]?.id ?? null)

  const reviews = useMemo(() => carReviews.filter((r) => r.carId === car.id), [car.id])

  const subtotal = car.pricePerDay * days
  const convenience = Math.round(subtotal * 0.04)
  const taxes = Math.round((subtotal + convenience) * 0.18)
  const lines = [
    { label: `Rental (${days} days × ${formatInr(car.pricePerDay)})`, amount: subtotal },
    { label: 'Concierge & connectivity', amount: convenience, hint: 'Transparent service fee' },
    { label: 'GST', amount: taxes },
  ]

  const unavailable = car.unavailableDates ?? []

  return (
    <Section className="pt-8">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div
            className={cn(
              'overflow-hidden',
              cardSurfaceBase,
              cardSurfaceTransition,
              cardSurfaceHover,
            )}
          >
            <div className="relative aspect-[16/10]">
              <Image
                src={car.gallery[activeImage] ?? car.imageUrl}
                alt={car.name}
                fill
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
            <div className="flex gap-2 overflow-x-auto p-3">
              {car.gallery.map((src, idx) => (
                <button
                  key={`gallery-${idx}`}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    'relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition',
                    idx === activeImage
                      ? 'border-electric/60 ring-2 ring-electric/30'
                      : 'border-white/10 hover:border-white/25',
                  )}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="96px" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-soft md:text-4xl">{car.name}</h1>
            <p className="max-w-2xl text-silver leading-relaxed">{car.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-silver">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 text-electric" />
                {car.rating} · {car.reviews} reviews
              </span>
              <span>·</span>
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
                      className="flex justify-between gap-4 border-b border-white/5 pb-2 last:border-0"
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
                  A refundable pre-authorization of{' '}
                  <span className="font-semibold text-soft">{formatInr(car.securityDeposit)}</span>{' '}
                  is held at pickup. Released after a successful return inspection—typically 5–7 banking
                  days.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-semibold text-soft">Frequently asked</h2>
            <div
              className={cn(
                'mt-4 divide-y divide-white/[0.08]',
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
                      className="flex w-full items-center justify-between gap-4 py-4 text-left"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : faq.id)}
                    >
                      <span className="font-medium text-soft">{faq.question}</span>
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 shrink-0 text-silver transition',
                          open && 'rotate-180',
                        )}
                      />
                    </button>
                    {open ? (
                      <p className="pb-4 text-sm leading-relaxed text-silver">{faq.answer}</p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-semibold text-soft">Recent reviews</h2>
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
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="glass-panel space-y-5 rounded-[1.25rem] border border-white/[0.09] p-5 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-6">
            <div>
              <p className={cardEyebrow}>From per day</p>
              <p className="mt-1 text-3xl font-bold text-soft">{formatInr(car.pricePerDay)}</p>
            </div>

            <div>
              <label htmlFor="days" className="text-sm font-medium text-silver">
                Trip length (days)
              </label>
              <input
                id="days"
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
                className="mt-2 h-11 w-full rounded-xl border border-white/12 bg-matte/60 px-3 text-sm text-soft focus:border-electric/60 focus:outline-none focus:ring-2 focus:ring-electric/25"
              />
            </div>

            <PricingBreakdown lines={lines} />

            <div
              className={cn(
                cardSurfaceBase,
                cardSurfaceTransition,
                cardPaddingCompact,
                'bg-matte/[0.38]',
              )}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-soft">
                <CalendarDays className="h-4 w-4 text-electric" />
                Availability snapshot
              </div>
              <p className="mt-2 text-xs text-silver">
                Blocked workshop &amp; VIP holds appear below. Live calendar syncs at checkout.
              </p>
              {unavailable.length === 0 ? (
                <p className="mt-3 text-sm text-emerald">Fully open for the next 30 days</p>
              ) : (
                <ul className="mt-3 space-y-1 text-sm text-silver">
                  {unavailable.map((d) => (
                    <li key={d} className="flex justify-between rounded-lg bg-white/5 px-2 py-1">
                      <span>Hold</span>
                      <span className="tabular-nums text-soft">{d}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2 text-xs text-silver">
              <p>Pickup hubs: Andheri, Bandra, Colaba, Juhu, Powai — valet handoff available.</p>
            </div>

            {car.status === 'Available' ? (
              <Button size="lg" className="w-full" to={`/booking/${car.id}`}>
                Proceed to booking
              </Button>
            ) : (
              <Button size="lg" className="w-full" disabled>
                Currently unavailable
              </Button>
            )}
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
      </div>
    </Section>
  )
}
