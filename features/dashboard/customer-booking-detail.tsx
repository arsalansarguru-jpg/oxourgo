import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Ban,
  Calendar,
  CalendarRange,
  Camera,
  Check,
  Circle,
  FileText,
  Headphones,
  MapPin,
  Receipt,
  Sparkles,
  Wallet,
} from 'lucide-react'

import { BookingPdfToolkit } from '@/components/booking/booking-pdf-toolkit'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cardEyebrow, cardSurfaceBase, cardSurfaceHover, cardSurfaceTransition } from '@/components/ui/card-tokens'
import { BRAND } from '@/constants/brand'
import { parseConditionNotes } from '@/lib/booking/inspection'
import {
  CUSTOMER_BOOKING_STATUS_BADGE_VARIANT,
  customerBookingStatusLabel,
  formatPaymentStatusLabel,
  mapDbBookingStatusToCustomerBadge,
  paymentStatusBadgeVariant,
  resolveBookingVehicleVisual,
} from '@/lib/customer/booking-display'
import { bookingPaymentBreakdown } from '@/lib/payments/booking-payment'
import {
  formatPaymentMethodLabel,
  isOnlinePaymentMethod,
  onlinePaymentInstructions,
  payAtPickupInstructions,
} from '@/lib/payments/methods'
import { OnlinePaymentNotice } from '@/components/payments/online-payment-notice'
import { deriveCustomerBookingUiStatus, type CustomerBookingUiStatus } from '@/lib/customer/derive-booking-ui-status'
import { getPublicSiteUrl } from '@/lib/env/site-url'
import { CustomerBookingFinancialSection } from '@/features/dashboard/customer-booking-financial-section'
import { CustomerBookingViolationsSection } from '@/features/dashboard/customer-booking-violations-section'
import type { CustomerBookingViolationsBundle } from '@/lib/customer/violations-queries'
import { formatInr } from '@/lib/format'
import type { BookingWithCar } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils/cn'
import { bookingSupportPrefilledMessage, buildWhatsAppPrefilledUrl } from '@/lib/whatsapp/links'

function resolveVehicle(row: BookingWithCar) {
  const v = row.vehicles
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

function tripPhaseLine(ui: CustomerBookingUiStatus, row: BookingWithCar): string {
  switch (ui) {
    case 'active':
      return 'Your vehicle is on hire — drive safe and enjoy the road.'
    case 'upcoming':
      if (row.booking_status === 'confirmed') return 'Your booking is approved. We will see you at pickup.'
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
  if (row.booking_status === 'cancelled') {
    return [{ key: 'cancel', label: 'Cancelled', done: true, current: false }]
  }
  if (row.booking_status === 'completed') {
    return [
      { key: 'p', label: 'Pending review', done: true, current: false },
      { key: 'a', label: 'Approved', done: true, current: false },
      { key: 's', label: 'Pickup scheduled', done: true, current: false },
      { key: 'insp_p', label: 'Pickup inspection', done: true, current: false },
      { key: 't', label: 'On trip', done: true, current: false },
      { key: 'insp_r', label: 'Return inspection', done: true, current: false },
      { key: 'r', label: 'Vehicle returned', done: true, current: false },
      { key: 'c', label: 'Trip completed', done: true, current: false },
    ]
  }

  const pendingDone = row.booking_status !== 'pending_payment'
  const approvedDone = pendingDone && ['confirmed', 'active'].includes(row.booking_status)
  const pickupInspDone =
    Boolean(row.pickup_inspection_completed_at) || Boolean(row.handed_over_at) || row.booking_status === 'active'
  const activeDone =
    row.booking_status === 'active' || Boolean(row.handed_over_at) || row.booking_status === 'completed'
  const returnInspDone =
    Boolean(row.return_inspection_completed_at) || Boolean(row.returned_at) || row.booking_status === 'completed'
  const returnedDone = Boolean(row.returned_at) || row.booking_status === 'completed'
  const completedDone = row.booking_status === 'completed'

  const steps = [
    { key: 'p', label: 'Pending review', done: pendingDone },
    { key: 'a', label: 'Approved', done: approvedDone },
    { key: 's', label: 'Pickup scheduled', done: approvedDone },
    { key: 'insp_p', label: 'Pickup inspection', done: pickupInspDone },
    { key: 't', label: 'On trip', done: activeDone },
    { key: 'insp_r', label: 'Return inspection', done: returnInspDone },
    { key: 'r', label: 'Vehicle returned', done: returnedDone },
    { key: 'c', label: 'Trip completed', done: completedDone },
  ]

  let assignedCurrent = false
  return steps.map((s, i) => {
    const prevDone = i === 0 || steps[i - 1]!.done
    const current = !assignedCurrent && !s.done && prevDone
    if (current) assignedCurrent = true
    return { ...s, current }
  })
}

export type CustomerBookingInspectionView = {
  photos: { phase: string; slot: string; url: string | null }[]
  signatureUrl: string | null
}

export function CustomerBookingDetail({
  row,
  inspection,
  violationsBundle,
}: {
  row: BookingWithCar
  inspection?: CustomerBookingInspectionView | null
  violationsBundle?: CustomerBookingViolationsBundle | null
}) {
  const vehicle = resolveVehicle(row)
  const visual = resolveBookingVehicleVisual(row)
  const ui = deriveCustomerBookingUiStatus({
    booking_status: row.booking_status,
    pickup_date: row.pickup_date,
    return_date: row.return_date,
    handed_over_at: row.handed_over_at,
    returned_at: row.returned_at,
  })
  const bookingBadge = mapDbBookingStatusToCustomerBadge(row.booking_status)
  const steps = timelineSteps(row)
  const securityDeposit = vehicle?.security_deposit
  const payBreakdown = bookingPaymentBreakdown(row)
  const inventoryId = vehicle?.id
  const invoiceRef = `OX-${row.id.replace(/-/g, '').slice(0, 10).toUpperCase()}`
  const isCancelled = row.booking_status === 'cancelled'

  const pickupFmt = new Date(row.pickup_date).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })
  const returnFmt = new Date(row.return_date).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })
  const pickupCondition = parseConditionNotes(row.pickup_condition_notes)
  const returnCondition = parseConditionNotes(row.return_condition_notes)
  const siteBase = getPublicSiteUrl().replace(/\/+$/, '')
  const whatsAppPrefilled = buildWhatsAppPrefilledUrl(
    bookingSupportPrefilledMessage({
      bookingId: row.id,
      siteUrl: siteBase,
      carLabel: vehicle?.name?.trim() || vehicle?.brand || null,
      pickupSummary: pickupFmt,
    }),
  )

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
      <section className="overflow-hidden rounded-2xl border border-stroke shadow-[var(--shadow-card)] sm:rounded-3xl">
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
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-silver/95 md:text-base">{tripPhaseLine(ui, row)}</p>
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
                <div className="glass-panel inline-flex flex-col rounded-2xl border border-stroke-strong bg-matte/50 px-5 py-4 backdrop-blur-md">
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

      <Card className={cn(cardSurfaceTransition, cardSurfaceHover, 'overflow-hidden')}>
        <CardContent className="p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-electric" aria-hidden />
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">Payment &amp; settlement</h2>
          </div>
          <p className="mt-2 text-sm text-muted">
            Method: <span className="font-medium text-soft">{formatPaymentMethodLabel(row.payment_method)}</span> · Status{' '}
            <span className="font-medium text-soft">{formatPaymentStatusLabel(row.payment_status)}</span>
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Booking amount</dt>
              <dd className="mt-2 text-xl font-semibold tabular-nums text-soft">{formatInr(payBreakdown.bookingTotalRupees)}</dd>
            </div>
            <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Security deposit</dt>
              <dd className="mt-2 text-xl font-semibold tabular-nums text-soft">{formatInr(payBreakdown.securityDepositRupees)}</dd>
              <p className="mt-2 text-xs text-muted">Pre-auth at pickup — separate from rental balance.</p>
            </div>
            <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Pending rental</dt>
              <dd className="mt-2 text-xl font-semibold tabular-nums text-electric">{formatInr(payBreakdown.pendingRentalRupees)}</dd>
              <p className="mt-2 text-xs text-muted">Collected so far: {formatInr(payBreakdown.collectedRentalRupees)}</p>
            </div>
          </dl>
          {isOnlinePaymentMethod(row.payment_method) ? (
            <div className="mt-6 space-y-3">
              <OnlinePaymentNotice />
              <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-silver/95">
                {onlinePaymentInstructions().map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.06] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100/90">Pay at pickup</p>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed text-silver/95">
                {payAtPickupInstructions().map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={cn(cardSurfaceTransition, cardSurfaceHover, 'overflow-hidden')}>
        <CardContent className="p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-electric" aria-hidden />
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">Documents</h2>
          </div>
          <p className="mt-2 text-sm text-muted">
            Official PDFs for this reservation — preview on mobile, download for your records, or print from the preview.
          </p>
          <BookingPdfToolkit bookingId={row.id} className="mt-6" />
        </CardContent>
      </Card>

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
                <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4">
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <Calendar className="h-3.5 w-3.5 text-electric/85" aria-hidden />
                    Pickup
                  </dt>
                  <dd className="mt-2 text-sm font-medium leading-snug text-soft sm:text-base">{pickupFmt}</dd>
                </div>
                <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4">
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <Calendar className="h-3.5 w-3.5 text-electric/85" aria-hidden />
                    Return
                  </dt>
                  <dd className="mt-2 text-sm font-medium leading-snug text-soft sm:text-base">{returnFmt}</dd>
                </div>
                <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4 sm:col-span-2">
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
                <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Rental length</dt>
                  <dd className="mt-2 text-2xl font-semibold tabular-nums text-soft">{row.rental_days} days</dd>
                </div>
                <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4">
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    <Receipt className="h-3.5 w-3.5 text-electric/85" aria-hidden />
                    Invoice ref
                  </dt>
                  <dd className="mt-2 font-mono text-sm text-soft">{invoiceRef}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className={cn(cardSurfaceTransition, cardSurfaceHover, 'overflow-hidden')}>
            <CardContent className="p-5 sm:p-7">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-electric" aria-hidden />
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">Handover &amp; return</h2>
              </div>
              <p className="mt-2 text-sm text-muted">
                {row.handed_over_at
                  ? 'Your trip handover is on file. Below is a summary of what we recorded at pickup and return.'
                  : 'After pickup, your handover summary and vehicle photos will appear here.'}
              </p>
              {row.handed_over_at ? (
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Pickup fuel</dt>
                    <dd className="mt-2 text-sm font-medium text-soft">
                      {row.pickup_fuel_level != null ? `${row.pickup_fuel_level}%` : '—'}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Pickup odometer</dt>
                    <dd className="mt-2 text-sm font-medium text-soft">
                      {row.pickup_odometer_km != null ? `${row.pickup_odometer_km.toLocaleString()} km` : '—'}
                    </dd>
                  </div>
                  {row.customer_handover_signed_at ? (
                    <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4 sm:col-span-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Signature</dt>
                      <dd className="mt-2 text-xs text-muted">
                        Acknowledged {new Date(row.customer_handover_signed_at).toLocaleString()}
                      </dd>
                      {inspection?.signatureUrl ? (
                        <div className="relative mt-3 h-36 w-full max-w-sm overflow-hidden rounded-xl border border-stroke bg-white">
                          <Image src={inspection.signatureUrl} alt="Your signature" fill className="object-contain p-2" unoptimized />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {pickupCondition.cleanliness?.trim() ? (
                    <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4 sm:col-span-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Cleanliness at pickup</dt>
                      <dd className="mt-2 text-sm text-soft">{pickupCondition.cleanliness}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              <CustomerBookingFinancialSection row={row} />

              {violationsBundle ? <CustomerBookingViolationsSection bundle={violationsBundle} /> : null}

              {row.returned_at || row.return_fuel_level != null || row.return_odometer_km != null ? (
                <div className="mt-6 border-t border-stroke pt-6">
                  <h3 className="text-sm font-semibold text-soft">Return summary</h3>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Return fuel</dt>
                      <dd className="mt-2 text-sm font-medium text-soft">
                        {row.return_fuel_level != null ? `${row.return_fuel_level}%` : '—'}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Return odometer</dt>
                      <dd className="mt-2 text-sm font-medium text-soft">
                        {row.return_odometer_km != null ? `${row.return_odometer_km.toLocaleString()} km` : '—'}
                      </dd>
                    </div>
                    {returnCondition.cleanliness?.trim() ? (
                      <div className="rounded-2xl border border-stroke bg-matte/[0.35] p-4 sm:col-span-2">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Cleanliness at return</dt>
                        <dd className="mt-2 text-sm text-soft">{returnCondition.cleanliness}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : null}

              {inspection?.photos?.length ? (
                <div className="mt-6 border-t border-stroke pt-6">
                  <h3 className="text-sm font-semibold text-soft">Vehicle photos</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {inspection.photos.map((p) =>
                      p.url ? (
                        <div key={`${p.phase}-${p.slot}`} className="relative aspect-video overflow-hidden rounded-xl border border-stroke">
                          <Image src={p.url} alt={`${p.phase} ${p.slot}`} fill className="object-cover" unoptimized />
                          <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
                            {p.phase} · {p.slot}
                          </span>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              ) : null}
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
                <li className="flex justify-between gap-4 border-b border-stroke pb-3 text-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-soft">{formatInr(row.subtotal_rupees)}</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-stroke pb-3 text-muted">
                  <span>Concierge &amp; connectivity</span>
                  <span className="tabular-nums text-soft">{formatInr(row.convenience_fee_rupees)}</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-stroke pb-3 text-muted">
                  <span>GST</span>
                  <span className="tabular-nums text-soft">{formatInr(row.gst_rupees)}</span>
                </li>
                <li className="flex justify-between gap-4 pt-1 text-base font-semibold text-soft">
                  <span>Contract total</span>
                  <span className="tabular-nums">{formatInr(row.total_rupees)}</span>
                </li>
                {row.deposit_held_rupees != null ? (
                  <li className="flex justify-between gap-4 border-t border-stroke pt-3 text-muted">
                    <span>Deposit held (booking)</span>
                    <span className="tabular-nums text-soft">{formatInr(row.deposit_held_rupees)}</span>
                  </li>
                ) : null}
                {row.deposit_refunded_rupees != null ? (
                  <li className="flex justify-between gap-4 text-muted">
                    <span>Deposit refunded</span>
                    <span className="tabular-nums text-soft">{formatInr(row.deposit_refunded_rupees)}</span>
                  </li>
                ) : null}
                {row.deposit_refunded_at ? (
                  <li className="text-xs text-muted">
                    Refund recorded {new Date(row.deposit_refunded_at).toLocaleString()}
                  </li>
                ) : null}
              </ul>
              {securityDeposit != null ? (
                <p className="mt-5 rounded-xl border border-stroke bg-fill-glass px-3 py-2.5 text-xs leading-relaxed text-muted">
                  Security deposit at handoff:{' '}
                  <span className="font-semibold text-soft">{formatInr(Number(securityDeposit))}</span> — pre-auth per
                  fleet policy.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* Vehicle */}
          {vehicle ? (
            <Card className={cn(cardSurfaceBase, 'border border-stroke')}>
              <CardContent className="p-5 sm:p-7">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-electric" aria-hidden />
                  <h2 className="text-lg font-semibold text-soft">Vehicle</h2>
                </div>
                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  {vehicle.registration_number?.trim() ? (
                    <div>
                      <dt className="text-muted">Registration</dt>
                      <dd className="mt-1 font-medium text-soft">{vehicle.registration_number}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-muted">Year</dt>
                    <dd className="mt-1 font-medium text-soft">{vehicle.year}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Fuel</dt>
                    <dd className="mt-1 text-soft">{vehicle.fuel_type}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Transmission</dt>
                    <dd className="mt-1 text-soft">{vehicle.transmission}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Seats</dt>
                    <dd className="mt-1 text-soft">{vehicle.seats}</dd>
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
          ) : (
            <Card className={cn(cardSurfaceBase, 'border border-stroke')}>
              <CardContent className="p-5 sm:p-7">
                <h2 className="text-lg font-semibold text-soft">Vehicle</h2>
                <p className="mt-2 text-sm text-muted">
                  Vehicle details are not attached to this reservation. Contact support with your invoice ref{' '}
                  <span className="font-mono text-soft">{invoiceRef}</span> if this looks wrong.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card className={cn(cardSurfaceBase, 'border border-stroke')}>
            <CardContent className="p-5 sm:p-7">
              <h2 className="text-lg font-semibold text-soft">Status timeline</h2>
              <ul className="mt-6 space-y-3">
                {steps.map((s) => (
                  <li key={s.key} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                        s.done
                          ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald'
                          : s.current
                            ? 'border-electric/50 bg-electric/15 text-electric shadow-[0_0_0_3px_rgba(59,130,246,0.18)]'
                            : 'border-stroke-strong text-muted',
                      )}
                    >
                      {s.done ? <Check className="h-4 w-4" aria-hidden /> : s.current ? '●' : <Circle className="h-4 w-4" aria-hidden />}
                    </span>
                    <div>
                      <p className={cn('font-medium', s.current ? 'text-soft' : 'text-soft/90')}>{s.label}</p>
                      {s.current ? <p className="text-xs text-electric/90">Current step</p> : null}
                    </div>
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
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted/90">Policy</p>
                </div>
              </div>
              {isCancelled && row.ops_note?.trim() ? (
                <p className="mt-3 rounded-xl border border-stroke bg-matte/40 px-3 py-2 text-sm text-muted">
                  <span className="font-medium text-soft">Note: </span>
                  {row.ops_note.trim()}
                </p>
              ) : null}
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

          <Card className={cn(cardSurfaceTransition, cardSurfaceHover, 'glass-panel border border-stroke')}>
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
                <a href={whatsAppPrefilled} className="text-electric hover:underline" target="_blank" rel="noreferrer">
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
