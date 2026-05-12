import Link from 'next/link'
import { Check, Circle } from 'lucide-react'

import type { BookingWithCar } from '@/lib/supabase/database.types'
import { deriveCustomerBookingUiStatus } from '@/lib/customer/derive-booking-ui-status'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cardSurfaceBase, cardSurfaceHover, cardSurfaceTransition } from '@/components/ui/card-tokens'

function resolveCar(row: BookingWithCar) {
  const c = row.cars
  if (!c) return null
  return Array.isArray(c) ? c[0] ?? null : c
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
    { key: 'pickup', label: 'Pickup', done: new Date() >= new Date(row.pickup_at) },
    { key: 'return', label: 'Return', done: new Date() > new Date(row.return_at) },
    { key: 'complete', label: 'Completed', done: ui === 'completed' },
  ]
  if (row.booking_status === 'cancelled') {
    return [{ key: 'cancel', label: 'Cancelled', done: true }]
  }
  return steps
}

export function CustomerBookingDetail({ row }: { row: BookingWithCar }) {
  const car = resolveCar(row)
  const ui = deriveCustomerBookingUiStatus(row)
  const carTitle = car ? `${car.brand} ${car.model}`.trim() : 'Vehicle'
  const steps = timelineSteps(row)

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Booking</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-soft">{carTitle}</h1>
          <p className="mt-2 font-mono text-xs text-muted">ID {row.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={ui === 'active' || ui === 'pending_review' ? 'electric' : ui === 'completed' ? 'success' : 'muted'}>
            {ui === 'pending_review' ? 'Pending review' : ui}
          </Badge>
          <Badge variant="electric">Pay: {row.payment_status}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className={cn(cardSurfaceTransition, cardSurfaceHover, 'lg:col-span-2')}>
          <CardContent className="space-y-4 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-soft">Trip</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Pickup</dt>
                <dd className="mt-1 font-medium text-soft">
                  {new Date(row.pickup_at).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Return</dt>
                <dd className="mt-1 font-medium text-soft">
                  {new Date(row.return_at).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Pickup hub</dt>
                <dd className="mt-1 text-soft">{row.pickup_location}</dd>
              </div>
              <div>
                <dt className="text-muted">Return hub</dt>
                <dd className="mt-1 text-soft">{row.return_location}</dd>
              </div>
              <div>
                <dt className="text-muted">Rental days</dt>
                <dd className="mt-1 text-soft">{row.rental_days}</dd>
              </div>
              <div>
                <dt className="text-muted">Invoice ref</dt>
                <dd className="mt-1 font-mono text-xs text-soft">OX-{row.id.replace(/-/g, '').slice(0, 10).toUpperCase()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className={cn(cardSurfaceTransition, cardSurfaceHover)}>
          <CardContent className="space-y-3 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-soft">Amounts</h2>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums text-soft">{formatInr(row.subtotal_rupees)}</span>
              </li>
              <li className="flex justify-between">
                <span>Concierge</span>
                <span className="tabular-nums text-soft">{formatInr(row.convenience_fee_rupees)}</span>
              </li>
              <li className="flex justify-between">
                <span>GST</span>
                <span className="tabular-nums text-soft">{formatInr(row.gst_rupees)}</span>
              </li>
              <li className="flex justify-between border-t border-white/[0.08] pt-2 text-base font-semibold text-soft">
                <span>Total</span>
                <span className="tabular-nums">{formatInr(row.total_rupees)}</span>
              </li>
            </ul>
            {car ? (
              <p className="text-xs text-muted">
                Security deposit (at pickup):{' '}
                <span className="font-medium text-soft">{formatInr(car.security_deposit)}</span>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {car ? (
        <Card className={cn(cardSurfaceBase, 'border border-white/[0.08]')}>
          <CardContent className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-soft">Vehicle</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Registration</dt>
                <dd className="mt-1 text-soft">{car.registration_number}</dd>
              </div>
              <div>
                <dt className="text-muted">Year</dt>
                <dd className="mt-1 text-soft">{car.year}</dd>
              </div>
              <div>
                <dt className="text-muted">Fuel</dt>
                <dd className="mt-1 text-soft">{car.fuel_type}</dd>
              </div>
              <div>
                <dt className="text-muted">Transmission</dt>
                <dd className="mt-1 text-soft">{car.transmission}</dd>
              </div>
              <div>
                <dt className="text-muted">Seats</dt>
                <dd className="mt-1 text-soft">{car.seats}</dd>
              </div>
            </dl>
            <div className="mt-5">
              <Button variant="secondary" to={`/car/${car.id}`}>
                Open vehicle page
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className={cn(cardSurfaceBase, 'border border-white/[0.08]')}>
        <CardContent className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-soft">Status timeline</h2>
          <ul className="mt-5 space-y-3">
            {steps.map((s) => (
              <li key={s.key} className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
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

      <p className="text-center text-sm text-muted">
        <Link href="/dashboard/bookings" className="text-electric hover:underline">
          ← All bookings
        </Link>
      </p>
    </div>
  )
}
