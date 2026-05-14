'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CalendarRange, CheckCircle2, Loader2, MapPin, Sparkles } from 'lucide-react'

import { createBookingAction } from '@/app/(main)/(public)/booking/[id]/actions'
import { captureClientEvent } from '@/lib/analytics/capture-client'
import { BOOKING_FUNNEL, POSTHOG_EVENTS } from '@/lib/analytics/posthog-events'
import { customerBookingFailureCopy } from '@/lib/booking/customer-booking-failure-copy'
import { SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import { safeAvailabilityReason } from '@/lib/booking/safe-availability-reason'
import { defaultPickupReturnIso } from '@/lib/booking/dates'
import { validateTripWindow } from '@/lib/booking/dates'
import { BRAND } from '@/constants/brand'
import { MUMBAI_HUBS } from '@/lib/booking/constants'
import { useBookingPrice } from '@/hooks/use-booking-price'
import type { Car } from '@/types/car'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { BookingSummaryCard } from '@/components/booking/booking-summary-card'
import { cardEyebrow } from '@/components/ui/card-tokens'

type AvailState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'ready'; available: boolean; reason?: string }
  | { status: 'error'; message: string }

function totalRupeesBand(total: number): string {
  if (total < 50_000) return 'lt_50k'
  if (total < 100_000) return '50k_100k'
  if (total < 200_000) return '100k_200k'
  return 'gte_200k'
}

export type CarDetailBookingPanelProps = {
  car: Car
  isLoggedIn: boolean
  /** True when profile KYC gate is cleared for booking. */
  kycApproved: boolean
  /** From `profiles.kyc_status` for messaging when booking is blocked. */
  kycStatus?: string | null
}

export function CarDetailBookingPanel({ car, isLoggedIn, kycApproved, kycStatus }: CarDetailBookingPanelProps) {
  const router = useRouter()
  const defaults = useMemo(() => defaultPickupReturnIso(), [])
  const [pickup, setPickup] = useState(defaults.pickup)
  const [returnAt, setReturnAt] = useState(defaults.return)
  const [pickupHub, setPickupHub] = useState<string>(MUMBAI_HUBS[1])
  const [sameReturnHub, setSameReturnHub] = useState(true)
  const [returnHub, setReturnHub] = useState<string>(MUMBAI_HUBS[1])
  const [avail, setAvail] = useState<AvailState>({ status: 'idle' })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitUi, setSubmitUi] = useState<'idle' | 'success'>('idle')
  const [pending, startTransition] = useTransition()

  const { dates, quote, pricingLines, hasValidQuote } = useBookingPrice({
    pricePerDay: car.pricePerDay,
    pickup,
    returnAt,
  })

  const loginHref = `/login?${new URLSearchParams({ redirect: `/car/${car.id}` }).toString()}`

  const checkAvailability = useCallback(async () => {
    const v = validateTripWindow(pickup, returnAt)
    if (!v.ok) {
      setAvail({ status: 'ready', available: false, reason: v.message })
      return
    }
    setAvail({ status: 'checking' })
    const qs = new URLSearchParams({
      carId: car.id,
      pickup: new Date(pickup).toISOString(),
      return: new Date(returnAt).toISOString(),
    })
    try {
      const res = await fetch(`/api/bookings/availability?${qs}`)
      const body = (await res.json()) as {
        ok?: boolean
        available?: boolean
        reason?: string
        error?: string
        hint?: string
      }
      if (!res.ok || body.ok === false) {
        console.error('[car-detail-booking-panel] checkAvailability', res.status, body)
        setAvail({
          status: 'error',
          message: SAFE_USER_MESSAGE.availability,
        })
        return
      }
      setAvail({
        status: 'ready',
        available: Boolean(body.available),
        reason: safeAvailabilityReason(body.reason) ?? safeAvailabilityReason(body.hint),
      })
    } catch (e) {
      console.error('[car-detail-booking-panel] checkAvailability', e)
      setAvail({ status: 'error', message: SAFE_USER_MESSAGE.availability })
    }
  }, [car.id, pickup, returnAt])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void checkAvailability()
    }, 420)
    return () => window.clearTimeout(t)
  }, [checkAvailability])

  const inventoryAvailable = car.status === 'Available'

  const canSubmit =
    inventoryAvailable &&
    isLoggedIn &&
    kycApproved &&
    dates.ok &&
    quote &&
    avail.status === 'ready' &&
    avail.available &&
    !pending &&
    submitUi !== 'success'

  const pricingLoading = avail.status === 'checking' && dates.ok && Boolean(quote)

  const onSubmit = () => {
    setFormError(null)
    setSubmitUi('idle')
    if (!inventoryAvailable) {
      setFormError('This vehicle is not available to book.')
      return
    }
    if (!dates.ok || !quote) {
      setFormError(dates.ok ? 'Unable to compute pricing for this listing.' : dates.message)
      return
    }
    if (!isLoggedIn) {
      setFormError('Sign in to complete your reservation.')
      return
    }
    if (!kycApproved) {
      setFormError('Complete identity verification to continue.')
      return
    }
    if (avail.status !== 'ready' || !avail.available) {
      setFormError('Choose times that are available on our calendar.')
      return
    }

    captureClientEvent(POSTHOG_EVENTS.bookingAttempt, {
      funnel: BOOKING_FUNNEL,
      step: 'booking_attempt',
      vehicle_id: car.id,
      rental_days: dates.ok ? dates.rentalDays : undefined,
    })

    startTransition(async () => {
      const result = await createBookingAction({
        carId: car.id,
        pickupAtIso: new Date(pickup).toISOString(),
        returnAtIso: new Date(returnAt).toISOString(),
        pickupLocation: pickupHub,
        returnLocation: sameReturnHub ? pickupHub : returnHub,
      })
      if (!result.ok) {
        console.error('[car-detail-booking-panel] createBookingAction', result.code)
        setFormError(customerBookingFailureCopy(result.code))
        return
      }
      captureClientEvent(POSTHOG_EVENTS.bookingCompleted, {
        funnel: BOOKING_FUNNEL,
        step: 'booking_complete',
        vehicle_id: car.id,
        rental_days: quote.rentalDays,
        total_band: totalRupeesBand(quote.totalRupees),
      })
      setSubmitUi('success')
      setFormError(null)
      window.setTimeout(() => {
        router.push('/dashboard/bookings')
        router.refresh()
      }, 720)
    })
  }

  const unavailableReason =
    avail.status === 'ready' && !avail.available
      ? safeAvailabilityReason(avail.reason) ?? 'Those windows are not available. Try adjacent dates.'
      : null

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <p className={cardEyebrow}>Reserve</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-soft">Book this vehicle</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Concierge-handled hubs, live calendar sync, and transparent pricing — refined for Oxour Go members.
        </p>
      </div>

      {!inventoryAvailable ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-400/25 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-50/95"
        >
          This listing is unavailable. Browse the fleet for similar options.
        </motion.div>
      ) : null}

      {isLoggedIn && !kycApproved ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          role="region"
          id="kyc-booking-gate"
          aria-label="Verification required"
          className="rounded-xl border border-electric/25 bg-electric/[0.07] px-4 py-4 text-sm shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-electric" aria-hidden />
            <div className="min-w-0">
              <p className="font-semibold text-soft">
                {(kycStatus ?? '').toLowerCase() === 'rejected'
                  ? 'Verification needs a quick fix'
                  : (kycStatus ?? '').toLowerCase() === 'pending'
                    ? 'Verification in progress'
                    : 'Complete identity verification to continue'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {(kycStatus ?? '').toLowerCase() === 'rejected'
                  ? 'One or more documents were not accepted. Open KYC Center to read the reviewer note and upload replacements.'
                  : (kycStatus ?? '').toLowerCase() === 'pending'
                    ? 'Our operations desk is reviewing your uploads. Once everything is approved, booking unlocks automatically.'
                    : 'We verify government ID before holding a vehicle on the calendar — a quick, secure step.'}
              </p>
              <Button type="button" size="sm" variant="secondary" className="mt-4 w-full sm:w-auto" to="/dashboard/kyc">
                Go to KYC Center
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}

      {!isLoggedIn ? (
        <Button size="sm" variant="secondary" className="w-full" to={loginHref}>
          Sign in to book
        </Button>
      ) : null}

      <motion.div layout className="rounded-2xl border border-stroke bg-carbon/55 p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] backdrop-blur-xl sm:p-5">
        <div className="flex items-center gap-2 text-soft">
          <CalendarRange className="h-4 w-4 text-electric" aria-hidden />
          <h3 className="text-sm font-semibold tracking-[-0.02em]">Trip window</h3>
        </div>
        <p className="mt-1 text-xs text-muted">Pickup cannot be in the past. Minimum one rental day. GST 18% on rental + concierge.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-1">
          <Input label="Pickup" type="datetime-local" value={pickup} onChange={(e) => setPickup(e.target.value)} />
          <Input label="Return" type="datetime-local" value={returnAt} onChange={(e) => setReturnAt(e.target.value)} />
        </div>
        {!dates.ok ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-xs font-medium text-amber-200/95"
            role="alert"
          >
            {dates.message}
          </motion.p>
        ) : null}
      </motion.div>

      <motion.div layout className="rounded-2xl border border-stroke bg-carbon/55 p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] backdrop-blur-xl sm:p-5">
        <div className="flex items-center gap-2 text-soft">
          <MapPin className="h-4 w-4 text-electric" aria-hidden />
          <h3 className="text-sm font-semibold tracking-[-0.02em]">Hubs</h3>
        </div>
        <div className="mt-4 space-y-3">
          <Select label="Pickup hub" value={pickupHub} onChange={(e) => setPickupHub(e.target.value)}>
            {MUMBAI_HUBS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={sameReturnHub}
              onChange={(e) => setSameReturnHub(e.target.checked)}
              className="h-4 w-4 rounded border-stroke-strong bg-matte text-electric focus:ring-electric/40"
            />
            Return to the same hub
          </label>
          {!sameReturnHub ? (
            <Select label="Return hub" value={returnHub} onChange={(e) => setReturnHub(e.target.value)}>
              {MUMBAI_HUBS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
      </motion.div>

      <BookingSummaryCard
        vehicleName={car.name}
        vehicleImageUrl={car.imageUrl}
        pickup={pickup}
        returnAt={returnAt}
        rentalDays={dates.ok ? dates.rentalDays : null}
        showPricing={hasValidQuote}
        pricingLoading={pricingLoading}
        pricingLines={pricingLines}
        quote={quote}
        securityDeposit={car.securityDeposit}
      />

      <div className="rounded-xl border border-stroke bg-matte/[0.35] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Availability</p>
        <div className="mt-3 flex items-start gap-2 text-sm">
          {avail.status === 'checking' ? (
            <>
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-electric" aria-hidden />
              <span className="text-muted">Syncing live calendar…</span>
            </>
          ) : avail.status === 'error' ? (
            <>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
              <span className="text-amber-100/90">{avail.message}</span>
            </>
          ) : avail.status === 'ready' ? (
            avail.available ? (
              <>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald" aria-hidden />
                <span className="text-emerald-100/95">Open for these times.</span>
              </>
            ) : (
              <>
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
                <span className="text-amber-100/90">{unavailableReason}</span>
              </>
            )
          ) : (
            <span className="text-muted">Adjust dates to refresh availability.</span>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {submitUi === 'success' ? (
          <motion.div
            key="ok"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.09] px-4 py-3 text-sm text-emerald-50/95"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald" aria-hidden />
            <p className="leading-relaxed">
              <span className="font-semibold text-soft">Booking confirmed.</span> Taking you to your trips…
            </p>
          </motion.div>
        ) : formError ? (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3 rounded-xl border border-stroke bg-fill-glass px-3 py-2.5 text-sm text-muted shadow-[var(--shadow-card)]"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/90" aria-hidden />
            <p className="leading-relaxed text-soft">{formError}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
        aria-describedby={!kycApproved && isLoggedIn ? 'kyc-booking-gate' : undefined}
        onClick={onSubmit}
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Confirming…
          </span>
        ) : submitUi === 'success' ? (
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Confirmed
          </span>
        ) : !isLoggedIn ? (
          'Sign in to reserve'
        ) : !kycApproved ? (
          'Complete verification to book'
        ) : (
          'Confirm booking'
        )}
      </Button>

      <p className="text-center text-[11px] text-muted">
        {BRAND.name} ·{' '}
        <Link href="/terms" className="text-electric hover:underline">
          Terms
        </Link>
      </p>
    </div>
  )
}
