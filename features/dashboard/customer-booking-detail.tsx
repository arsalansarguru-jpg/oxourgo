import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Ban,
  Calendar,
  CalendarRange,
  Check,
  Circle,
  Headphones,
  MapPin,
  Receipt,
  Sparkles,
  Wallet,
} from 'lucide-react'

import { BRAND } from '@/constants/brand'
import type { BookingWithCar } from '@/lib/supabase/database.types'
import {
  CUSTOMER_BOOKING_STATUS_BADGE_VARIANT,
  customerBookingStatusLabel,
  formatPaymentStatusLabel,
  mapDbBookingStatusToCustomerBadge,
  paymentStatusBadgeVariant,
  resolveBookingVehicleVisual,
} from '@/lib/customer/booking-display'
import { deriveCustomerBookingUiStatus, type CustomerBookingUiStatus } from '@/lib/customer/derive-booking-ui-status'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cardEyebrow, cardSurfaceBase, cardSurfaceHover, cardSurfaceTransition } from '@/components/ui/card-tokens'

function resolveCar(row: BookingWithCar) {
  const c = row.cars
  if (!c) return null
  return Array.isArray(c) ? c[0] ?? null : c
}

function resolveVehicle(row: BookingWithCar) {
  const v = row.vehicles
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

function tripPhaseLine(ui: CustomerBookingUiStatus): string {
  switch (ui) {
    case 'active':
      return 'Your vehicle is on hire — drive safe and enjoy the road.'
    case 'upcoming':
      return 'Upcoming trip — hubs and handoff details are locked in below.'
    case 'pending_review':
      return 'We are confirming payment and fleet allocation. You will be notified shortly.'
    case 'completed':
      return 'This trip is complete. Thank you for choosing Oxour Go.'
    case 'cancelled':
      return 'This reservation was cancelled.'
    default:
      return ''
  }
}

function timelineSteps(row: BookingWithCar) {
  const ui = deriveCustomerBookingUiStatus(row)
  const steps = [
    { key: 'created', label: 'Booking created', done: true },
    {
      key: 'ops',
      label: 'Operations review',
      done: row.booking_status !== 'pending_payment',
    },
    {
      key: 'confirmed',
      label: 'Confirmed',
      done:
        row.booking_status === 'confirmed' ||
        row.booking_status === 'completed' ||
        ui === 'active' ||
        ui === 'upcoming',
    },
    { key: 'pickup', label: 'Pickup', done: new Date() >= new Date(row.pickup_date) },
    { key: 'return', label: 'Return', done: new Date() > new Date(row.return_date) },
    { key: 'complete', label: 'Completed', done: ui === 'completed' },
  ]
  if (row.booking_status === 'cancelled') {
    return [{ key: 'cancel', label: 'Cancelled', done: true }]
  }
  return steps
}

export function CustomerBookingDetail({ row }: { row: BookingWithCar }) {
  const car = resolveCar(row)
  const vehicle = resolveVehicle(row)
  const visual = resolveBookingVehicleVisual(row)
  const ui = deriveCustomerBookingUiStatus(row)
  const bookingBadge = mapDbBookingStatusToCustomerBadge(row.booking_status)
  const steps = timelineSteps(row)
  const securityDeposit = car?.security_deposit ?? vehicle?.security_deposit
  const inventoryId = car?.id ?? vehicle?.id
  const invoiceRef = `OX-${row.id.replace(/-/g, '').slice(0, 10).toUpperCase()}`
  const isCancelled = row.booking_status === 'cancelled'

  const pickupFmt = new Date(row.pickup_date).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })
  const returnFmt = new Date(row.return_date).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })

  return (
    <div className="space-y-8 pb-4 md:space-y-10 md:pb-8">
      <nav>
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-soft"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-electric/90" aria-hidden />
          All bookings
        </Link>
      </nav>

      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-white/[0.09] shadow-[var(--shadow-card)] sm:rounded-3xl">
        <div className="relative min-h-[200px] w-full md:min-h-[300px]">
          <Image
            src={visual.imageUrl}
            alt={visual.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 960px"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-matte via-matte/55 to-matte/10"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 md:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className={cn(cardEyebrow, 'text-electric/90')}>{visual.brand}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-soft drop-shadow-sm md:text-4xl lg:text-[2.5rem] lg:leading-tight">
                  {visual.name}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-silver/95 md:text-base">{tripPhaseLine(ui)}</p>
                <p className="mt-3 font-mono text-[11px] text-muted/90">Ref · {invoiceRef}</p>
              </div>
              <div className="flex flex-col gap-4 lg:items-end lg:text-right">
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Badge variant={CUSTOMER_BOOKING_STATUS_BADGE_VARIANT[bookingBadge]}>
                    {customerBookingStatusLabel(bookingBadge)}
                  </Badge>
                  <Badge variant={paymentStatusBadgeVariant(row.payment_status)}>
                    Payment · {formatPaymentStatusLabel(row.payment_status)}
                  </Badge>
                </div>
                <div className="glass-panel inline-flex flex-col rounded-2xl border border-white/[0.12] bg-matte/50 px-5 py-4 backdrop-blur-md">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Total</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums tracking-[-0.04em] text-soft md:text-4xl">
                    {formatInr(row.total_rupees)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,340px)] lg:items-start lg:gap-8">
        <div className="space-y-6">
          {/* Trip summary */}
          <Card className={cn(cardSurfaceTransition, cardSurfaceHover, 'overflow-hidden')}>
            <CardContent className="p-5 sm:p-7">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-electric" aria-hidden />
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">Trip summary</h2>
              </div>
              <p className="mt-2 text-sm text-muted">
                Pickup and return windows, concierge hubs, and rental length for this reservation.
              </p>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.07] bg-matte/[0.35] p-4">
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <Calendar className="h-3.5 w-3.5 text-electric/85" aria-hidden />
                    Pickup
                  </dt>
                  <dd className="mt-2 text-sm font-medium leading-snug text-soft sm:text-base">{pickupFmt}</dd>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-matte/[0.35] p-4">
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <Calendar className="h-3.5 w-3.5 text-electric/85" aria-hidden />
                    Return
                  </dt>
                  <dd className="mt-2 text-sm font-medium leading-snug text-soft sm:text-base">{returnFmt}</dd>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-matte/[0.35] p-4 sm:col-span-2">
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <MapPin className="h-3.5 w-3.5 text-electric/85" aria-hidden />
                    Hubs
                  </dt>
                  <dd className="mt-2 text-sm text-soft">
                    <span className="text-muted">{row.pickup_location}</span>
                    <span className="mx-2 text-muted/50">→</span>
                    <span className="text-muted">{row.return_location}</span>
                  </dd>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-matte/[0.35] p-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Rental length</dt>
                  <dd className="mt-2 text-2xl font-semibold tabular-nums text-soft">{row.rental_days} days</dd>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-matte/[0.35] p-4">
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <Receipt className="h-3.5 w-3.5 text-electric/85" aria-hidden />
                    Invoice ref
                  </dt>
                  <dd className="mt-2 font-mono text-sm text-soft">{invoiceRef}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Amounts */}
          <Card className={cn(cardSurfaceTransition, cardSurfaceHover)}>
            <CardContent className="p-5 sm:p-7">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-electric" aria-hidden />
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">Amounts</h2>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex justify-between gap-4 border-b border-white/[0.06] pb-3 text-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-soft">{formatInr(row.subtotal_rupees)}</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-white/[0.06] pb-3 text-muted">
                  <span>Concierge &amp; connectivity</span>
                  <span className="tabular-nums text-soft">{formatInr(row.convenience_fee_rupees)}</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-white/[0.06] pb-3 text-muted">
                  <span>GST</span>
                  <span className="tabular-nums text-soft">{formatInr(row.gst_rupees)}</span>
                </li>
                <li className="flex justify-between gap-4 pt-1 text-base font-semibold text-soft">
                  <span>Total paid / due</span>
                  <span className="tabular-nums">{formatInr(row.total_rupees)}</span>
                </li>
              </ul>
              {securityDeposit != null ? (
                <p className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-xs leading-relaxed text-muted">
                  Security deposit at handoff:{' '}
                  <span className="font-semibold text-soft">{formatInr(Number(securityDeposit))}</span> — pre-auth per
                  fleet policy.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* Vehicle */}
          {car || vehicle ? (
            <Card className={cn(cardSurfaceBase, 'border border-white/[0.08]')}>
              <CardContent className="p-5 sm:p-7">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-electric" aria-hidden />
                  <h2 className="text-lg font-semibold text-soft">Vehicle</h2>
                </div>
                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted">Registration</dt>
                    <dd className="mt-1 font-medium text-soft">{car?.registration_number ?? vehicle?.registration_number}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Year</dt>
                    <dd className="mt-1 font-medium text-soft">{car?.year ?? vehicle?.year}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Fuel</dt>
                    <dd className="mt-1 text-soft">{car?.fuel_type ?? vehicle?.fuel_type}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Transmission</dt>
                    <dd className="mt-1 text-soft">{car?.transmission ?? vehicle?.transmission}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Seats</dt>
                    <dd className="mt-1 text-soft">{car?.seats ?? vehicle?.seats}</dd>
                  </div>
                </dl>
                {inventoryId ? (
                  <div className="mt-6">
                    <Button variant="secondary" to={`/car/${inventoryId}`}>
                      View vehicle page
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Timeline */}
          <Card className={cn(cardSurfaceBase, 'border border-white/[0.08]')}>
            <CardContent className="p-5 sm:p-7">
              <h2 className="text-lg font-semibold text-soft">Status timeline</h2>
              <ul className="mt-6 space-y-3">
                {steps.map((s) => (
                  <li key={s.key} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                        s.done ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald' : 'border-white/15 text-muted',
                      )}
                    >
                      {s.done ? <Check className="h-4 w-4" aria-hidden /> : <Circle className="h-4 w-4" aria-hidden />}
                    </span>
                    <p className="font-medium text-soft">{s.label}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: cancellation + support */}
        <aside className="space-y-5 lg:sticky lg:top-28">
          <Card className={cn(cardSurfaceTransition, cardSurfaceHover, 'border border-amber-400/15 bg-amber-500/[0.06]')}>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/15 text-amber-100">
                  <Ban className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold text-soft">Cancellation</h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-100/80">Placeholder</p>
                </div>
              </div>
              {isCancelled ? (
                <p className="text-sm leading-relaxed text-silver/95">
                  This booking is already cancelled. For deposit release timing or refunds, reach out to concierge with
                  your reference <span className="font-mono text-soft">{invoiceRef}</span>.
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-silver/95">
                  Self-service cancellation is not available in the app yet. Concierge will confirm eligibility, any
                  policy fees, and rebooking options before changes are applied.
                </p>
              )}
              <Button type="button" variant="secondary" className="w-full" disabled>
                Request cancellation (soon)
              </Button>
            </CardContent>
          </Card>

          <Card className={cn(cardSurfaceTransition, cardSurfaceHover, 'glass-panel border border-white/[0.1]')}>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-electric/30 bg-electric/15 text-electric">
                  <Headphones className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold text-soft">Concierge support</h3>
                  <p className="mt-1 text-sm text-muted">Active trips are prioritised — include your booking ref.</p>
                </div>
              </div>
              <Button className="w-full" size="lg" to="/support">
                Open support
              </Button>
              <p className="text-center text-xs text-muted">
                <a href={`mailto:${BRAND.email}`} className="text-electric hover:underline">
                  {BRAND.email}
                </a>
                <span className="mx-2 text-muted/40">·</span>
                <a href={BRAND.whatsapp} className="text-electric hover:underline" target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
