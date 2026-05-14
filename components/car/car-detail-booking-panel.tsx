'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CalendarRange, CheckCircle2, Loader2, MapPin, Shield } from 'lucide-react'

import { createBookingAction } from '@/app/(main)/(public)/booking/[id]/actions'
import { customerBookingFailureCopy } from '@/lib/booking/customer-booking-failure-copy'
import { SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import { BRAND } from '@/constants/brand'
import { formatInr } from '@/lib/format'
import { computeBookingQuote } from '@/lib/booking/pricing'
import { validateTripWindow } from '@/lib/booking/dates'
import { defaultPickupReturnIso } from '@/lib/booking/dates'
import { MUMBAI_HUBS } from '@/lib/booking/constants'
import type { Car } from '@/types/car'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PricingBreakdown } from '@/components/booking/pricing-breakdown'
import { cardEyebrow } from '@/components/ui/card-tokens'

type AvailState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'ready'; available: boolean; reason?: string }
  | { status: 'error'; message: string }

export type CarDetailBookingPanelProps = {
  car: Car
  isLoggedIn: boolean
  /** Mirrors `profiles.verification_tier === 'verified'` (KYC cleared for booking). */
  kycApproved: boolean
}

export function CarDetailBookingPanel({ car, isLoggedIn, kycApproved }: CarDetailBookingPanelProps) {
  const router = useRouter()
  const defaults = useMemo(() => defaultPickupReturnIso(), [])
  const [pickup, setPickup] = useState(defaults.pickup)
  const [returnAt, setReturnAt] = useState(defaults.return)
  const [pickupHub, setPickupHub] = useState<string>(MUMBAI_HUBS[1])
  const [sameReturnHub, setSameReturnHub] = useState(true)
  const [returnHub, setReturnHub] = useState<string>(MUMBAI_HUBS[1])
  const [avail, setAvail] = useState<AvailState>({ status: 'idle' })
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const dates = useMemo(() => validateTripWindow(pickup, returnAt), [pickup, returnAt])

  const quote = useMemo(() => {
    if (!dates.ok) return null
    const p = car.pricePerDay
    if (!Number.isFinite(p) || p <= 0) return null
    return computeBookingQuote(p, dates.rentalDays)
  }, [car.pricePerDay, dates])

  const lines = useMemo(() => {
    if (!quote) return []
    return [
      {
        label: `Rental (${quote.rentalDays} days × ${formatInr(car.pricePerDay)})`,
        amount: quote.subtotalRupees,
      },
      { label: 'Concierge & connectivity', amount: quote.convenienceFeeRupees, hint: 'Transparent service fee' },
      { label: 'GST', amount: quote.gstRupees },
    ]
  }, [quote, car.pricePerDay])

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
        reason: body.reason,
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
    !pending

  const onSubmit = () => {
    setFormError(null)
    if (!inventoryAvailable) {
      setFormError('This vehicle is not available to book.')
      return
    }
    if (!dates.ok || !quote) {
      setFormError(dates.ok ? 'Unable to compute pricing.' : dates.message)
      return
    }
    if (!isLoggedIn) {
      setFormError('Sign in to complete your reservation.')
      return
    }
    if (avail.status !== 'ready' || !avail.available) {
      setFormError('Choose times that are available.')
      return
    }

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
      router.push('/dashboard/bookings')
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <p className={cardEyebrow}>Reserve</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-soft">Book this vehicle</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Pickup and return times, Mumbai hubs, and live calendar check — same vault-grade flow as checkout.
        </p>
      </div>

      {!inventoryAvailable ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-50/95">
          This listing is unavailable. Browse the fleet for similar options.
        </div>
      ) : null}

      {isLoggedIn && !kycApproved ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-50/95">
          <p className="font-medium text-soft">Complete identity verification to book</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Government ID review is required before we can hold a vehicle on the calendar.
          </p>
          <Button type="button" size="sm" variant="secondary" className="mt-3 w-full sm:w-auto" to="/dashboard/kyc">
            Go to KYC center →
          </Button>
        </div>
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
        <p className="mt-1 text-xs text-muted">Pickup at least 2 hours ahead. Up to 60 days.</p>
        <div className="mt-4 grid gap-3">
          <Input label="Pickup" type="datetime-local" value={pickup} onChange={(e) => setPickup(e.target.value)} />
          <Input label="Return" type="datetime-local" value={returnAt} onChange={(e) => setReturnAt(e.target.value)} />
        </div>
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

      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Pricing</p>
        {!dates.ok ? (
          <p className="text-sm text-amber-100/90">{dates.message}</p>
        ) : !Number.isFinite(car.pricePerDay) || car.pricePerDay <= 0 ? (
          <p className="text-sm text-muted">Pricing is unavailable for this listing.</p>
        ) : quote ? (
          <PricingBreakdown lines={lines} />
        ) : (
          <div className="space-y-2 rounded-xl border border-stroke bg-matte/[0.35] p-4">
            <div className="h-3 w-[65%] animate-pulse rounded bg-fill-glass-strong" />
            <div className="h-3 w-[45%] animate-pulse rounded bg-fill-glass-strong" />
            <div className="h-3 w-[55%] animate-pulse rounded bg-fill-glass-strong" />
            <p className="text-xs text-muted">Calculating estimate…</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-stroke bg-matte/[0.35] p-4 text-sm text-muted">
        <div className="flex items-center gap-2 font-medium text-soft">
          <Shield className="h-4 w-4 text-electric" aria-hidden />
          Security deposit
        </div>
        <p className="mt-2 text-xs leading-relaxed">
          {car.securityDeposit <= 0 ? (
            <span className="text-muted">No security deposit required for this vehicle.</span>
          ) : (
            <>
              <span className="font-semibold text-soft">{formatInr(car.securityDeposit)}</span> pre-authorization at
              handoff. Released after return inspection.
            </>
          )}
        </p>
      </div>

      <div className="rounded-xl border border-stroke bg-matte/[0.35] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Availability</p>
        <div className="mt-3 flex items-start gap-2 text-sm">
          {avail.status === 'checking' ? (
            <>
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-electric" aria-hidden />
              <span className="text-muted">Checking calendar…</span>
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
                <span className="text-amber-100/90">{avail.reason ?? 'Unavailable for these times.'}</span>
              </>
            )
          ) : (
            <span className="text-muted">Adjust dates to check availability.</span>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {formError ? (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3 rounded-xl border border-stroke bg-fill-glass px-3 py-2.5 text-sm text-muted shadow-[var(--shadow-card)]"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/90" aria-hidden />
            <p className="leading-relaxed text-soft">{formError}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Button type="button" size="lg" className="w-full" disabled={!canSubmit} onClick={onSubmit}>
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Confirming…
          </span>
        ) : !isLoggedIn ? (
          'Sign in to reserve'
        ) : !kycApproved ? (
          'Verification required'
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
