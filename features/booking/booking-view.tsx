'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CalendarRange, Car as CarIcon, CheckCircle2, Loader2, MapPin, Shield } from 'lucide-react'

import { createBookingAction } from '@/app/(main)/(public)/booking/[id]/actions'
import { customerBookingFailureCopy } from '@/lib/booking/customer-booking-failure-copy'
import { SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import { BRAND } from '@/constants/brand'
import { formatInr } from '@/lib/format'
import { computeBookingQuote } from '@/lib/booking/pricing'
import { validateTripWindow } from '@/lib/booking/dates'
import { MUMBAI_HUBS } from '@/lib/booking/constants'
import type { Car } from '@/types/car'
import { cn } from '@/lib/utils/cn'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { PricingBreakdown } from '@/components/booking/pricing-breakdown'
import {
  cardSurfaceBase,
  cardSurfaceHover,
  cardSurfaceTransition,
} from '@/components/ui/card-tokens'

const panel =
  'rounded-2xl border border-stroke bg-carbon/55 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset] backdrop-blur-xl sm:rounded-3xl sm:p-6'

export type BookingViewProps = {
  car: Car
  defaultPickupIso: string
  defaultReturnIso: string
  isLoggedIn: boolean
  userEmail: string | null
}

type AvailState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'ready'; available: boolean; reason?: string }
  | { status: 'error'; message: string }

export function BookingView({ car, defaultPickupIso, defaultReturnIso, isLoggedIn, userEmail }: BookingViewProps) {
  const router = useRouter()
  const [pickup, setPickup] = useState(defaultPickupIso)
  const [returnAt, setReturnAt] = useState(defaultReturnIso)
  const [pickupHub, setPickupHub] = useState<string>(MUMBAI_HUBS[1])
  const [sameReturnHub, setSameReturnHub] = useState(true)
  const [returnHub, setReturnHub] = useState<string>(MUMBAI_HUBS[1])
  const [avail, setAvail] = useState<AvailState>({ status: 'idle' })
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ bookingId: string; totalRupees: number } | null>(null)
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
        console.error('[booking-view] checkAvailability', res.status, body)
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
      console.error('[booking-view] checkAvailability', e)
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
    dates.ok &&
    quote &&
    avail.status === 'ready' &&
    avail.available &&
    !pending &&
    !success

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
      setFormError('Sign in to confirm this booking.')
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
        console.error('[booking-view] createBookingAction', result.code)
        setFormError(customerBookingFailureCopy(result.code))
        return
      }
      setSuccess({ bookingId: result.bookingId, totalRupees: result.totalRupees })
      router.refresh()
    })
  }

  const loginHref = `/login?${new URLSearchParams({ redirect: `/booking/${car.id}` }).toString()}`

  if (success) {
    return (
      <Section className="pt-8 pb-16 md:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-lg rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.08] p-8 text-center shadow-[var(--shadow-card)]"
        >
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald" aria-hidden />
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-soft">Booking confirmed</h1>
          <p className="mt-2 text-sm leading-relaxed text-silver">
            Reference{' '}
            <span className="font-mono text-[13px] text-soft">{success.bookingId.slice(0, 8).toUpperCase()}…</span>
          </p>
          <p className="mt-3 text-lg font-semibold text-soft">{formatInr(success.totalRupees)} total</p>
          <p className="mt-2 text-sm text-muted">Payment status: pending — concierge will share Razorpay checkout.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button to="/dashboard">Dashboard</Button>
            <Button variant="secondary" to="/fleet">
              Fleet
            </Button>
          </div>
        </motion.div>
      </Section>
    )
  }

  return (
    <Section className="pt-6 pb-20 md:pt-10 md:pb-24">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Reserve</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-soft md:text-3xl">Book {car.name}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Live availability, transparent pricing, and instant confirmation — tied to your signed-in account.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" to={`/car/${car.id}`}>
            Vehicle details
          </Button>
          {!isLoggedIn ? (
            <Button to={loginHref}>Sign in to book</Button>
          ) : (
            <Badge variant="electric" className="h-10 items-center px-4">
              {userEmail ?? 'Signed in'}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <motion.div layout className={cn(panel, cardSurfaceTransition, cardSurfaceHover)}>
            <div className="flex items-center gap-2 text-soft">
              <CalendarRange className="h-5 w-5 text-electric" aria-hidden />
              <h2 className="text-lg font-semibold tracking-[-0.02em]">Trip window</h2>
            </div>
            <p className="mt-1 text-sm text-muted">Pickup must be at least 2 hours away. Max {60} days on one contract.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input label="Pickup" type="datetime-local" value={pickup} onChange={(e) => setPickup(e.target.value)} />
              <Input label="Return" type="datetime-local" value={returnAt} onChange={(e) => setReturnAt(e.target.value)} />
            </div>
          </motion.div>

          <motion.div layout className={cn(panel, cardSurfaceTransition, cardSurfaceHover)}>
            <div className="flex items-center gap-2 text-soft">
              <MapPin className="h-5 w-5 text-electric" aria-hidden />
              <h2 className="text-lg font-semibold tracking-[-0.02em]">Locations</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Select label="Pickup hub" value={pickupHub} onChange={(e) => setPickupHub(e.target.value)}>
                {MUMBAI_HUBS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
              <div className="md:col-span-2 flex items-center gap-2 text-sm text-muted">
                <input
                  id="same-hub"
                  type="checkbox"
                  checked={sameReturnHub}
                  onChange={(e) => setSameReturnHub(e.target.checked)}
                  className="h-4 w-4 rounded border-stroke-strong bg-matte text-electric focus:ring-electric/40"
                />
                <label htmlFor="same-hub">Return to the same hub</label>
              </div>
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

          <motion.div layout className={cn(panel, cardSurfaceBase)}>
            <div className="flex items-center gap-2 text-soft">
              <CarIcon className="h-5 w-5 text-electric" aria-hidden />
              <h2 className="text-lg font-semibold tracking-[-0.02em]">Vehicle</h2>
            </div>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-carbon-deep sm:h-36 sm:w-56 sm:shrink-0 sm:aspect-auto">
                <Image src={car.imageUrl} alt="" fill unoptimized className="object-cover" sizes="(max-width:768px) 100vw, 224px" />
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-sm text-muted">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold text-soft">{car.name}</span>
                  <Badge variant="electric">{car.category}</Badge>
                  <Badge variant={car.status === 'Available' ? 'success' : 'muted'}>{car.status}</Badge>
                </div>
                <p>{car.fuel} · {car.transmission} · {car.seats} seats</p>
                <p className="text-xs leading-relaxed">{car.description}</p>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {formError ? (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 rounded-2xl border border-stroke bg-fill-glass px-4 py-3 text-sm text-muted shadow-[var(--shadow-card)]"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/90" aria-hidden />
                <p className="leading-relaxed text-soft">{formError}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" size="lg" disabled={!canSubmit} onClick={onSubmit}>
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Confirming…
                </span>
              ) : (
                'Confirm booking'
              )}
            </Button>
            {!isLoggedIn ? (
              <Button variant="secondary" size="lg" to={loginHref}>
                Sign in first
              </Button>
            ) : null}
          </div>

          <p className="text-xs text-muted">
            By confirming you agree to Oxour Go rental terms. Questions?{' '}
            <Link href="/support" className="text-electric hover:underline">
              Concierge
            </Link>
            .
          </p>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className={cn(panel, 'space-y-5')}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Pricing summary</p>
            {quote ? (
              <PricingBreakdown lines={lines} />
            ) : (
              <p className="text-sm text-muted">Enter valid trip times to see pricing.</p>
            )}

            <div className="rounded-xl border border-stroke bg-matte/[0.35] p-4 text-sm text-muted">
              <div className="flex items-center gap-2 font-medium text-soft">
                <Shield className="h-4 w-4 text-electric" aria-hidden />
                Security deposit
              </div>
              <p className="mt-2 text-xs leading-relaxed">
                {formatInr(car.securityDeposit)} pre-authorization at handoff. Released after return inspection.
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
                      <span className="text-emerald-100/95">Open — no overlapping reservation.</span>
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

            <div className="rounded-xl border border-stroke bg-fill-glass p-3 text-center text-[11px] text-muted">
              {BRAND.name} · Mumbai self-drive
            </div>
          </div>
        </aside>
      </div>
    </Section>
  )
}
