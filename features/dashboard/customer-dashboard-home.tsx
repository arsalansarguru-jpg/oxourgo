import Link from 'next/link'
import { ArrowUpRight, Car, ShieldCheck, Sparkles } from 'lucide-react'

import type { BookingWithCar } from '@/lib/supabase/database.types'
import { deriveCustomerBookingUiStatus } from '@/lib/customer/derive-booking-ui-status'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cardSurfaceBase, cardSurfaceHover, cardSurfaceTransition } from '@/components/ui/card-tokens'
import { CustomerBookingCard } from '@/components/dashboard/customer-booking-card'
import { EmptyState } from '@/components/ui/EmptyState'

function carLabel(row: BookingWithCar): string {
  const c = row.cars
  if (c) {
    const car = Array.isArray(c) ? c[0] : c
    if (car) return `${car.brand} ${car.model}`.trim()
  }
  const v = row.vehicles
  if (v) {
    const veh = Array.isArray(v) ? v[0] : v
    if (veh) return (veh.name ?? `${veh.brand}`).trim() || 'Vehicle'
  }
  return 'Vehicle'
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className={cn(cardSurfaceTransition, cardSurfaceHover)}>
      <CardContent className="py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-soft tabular-nums">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

export function CustomerDashboardHome({
  bookings,
  kycUploadedCount,
}: {
  bookings: BookingWithCar[]
  kycUploadedCount: number
}) {
  const now = Date.now()
  const withUi = bookings.map((b) => ({ row: b, ui: deriveCustomerBookingUiStatus(b) }))

  const active = withUi.filter(({ ui, row }) => ui === 'active' || (ui === 'upcoming' && new Date(row.pickup_date).getTime() <= now + 36 * 60 * 60 * 1000))
  const upcoming = withUi.filter(({ ui }) => ui === 'upcoming')
  const spotlight = [...active, ...upcoming].slice(0, 3)

  const lifetime = bookings.reduce((s, b) => s + b.total_rupees, 0)

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Command center</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-soft md:text-[2rem]">Your Oxour journey</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Live bookings, verification, and payments — orchestrated for Mumbai self-drive with concierge-grade polish.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active trips" value={String(withUi.filter((x) => x.ui === 'active').length)} hint="On the road now" />
        <Stat label="Upcoming" value={String(upcoming.length)} hint="Confirmed ahead" />
        <Stat label="Lifetime spend" value={formatInr(lifetime)} hint="Posted rental totals" />
        <Stat label="KYC uploads" value={String(kycUploadedCount)} hint="Submitted documents" />
      </div>

      <div
        className={cn(
          'flex flex-col gap-4 rounded-2xl border border-electric/20 bg-gradient-to-br from-electric/[0.12] via-transparent to-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-6',
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.12] bg-matte/50">
            <Sparkles className="h-5 w-5 text-electric" aria-hidden />
          </div>
          <div>
            <p className="font-medium text-soft">Quick actions</p>
            <p className="mt-1 text-sm text-muted">Book, verify identity, or review payments in one tap.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button to="/fleet" className="min-h-11">
            Book a vehicle
          </Button>
          <Button variant="secondary" to="/dashboard/kyc" className="min-h-11">
            <ShieldCheck className="mr-1.5 h-4 w-4" aria-hidden />
            KYC center
          </Button>
          <Button variant="secondary" to="/dashboard/payments" className="min-h-11">
            Payments
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-soft">Upcoming &amp; active</h2>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-1 text-sm font-medium text-electric hover:underline"
          >
            View all
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {spotlight.length === 0 ? (
          <div className={cn(cardSurfaceBase, 'rounded-2xl border border-white/[0.08] p-6 sm:rounded-3xl')}>
            <EmptyState
              icon={Car}
              title="No trips yet"
              description="When you confirm a booking, it appears here with handoff details and live status."
              actionLabel="Browse fleet"
              to="/fleet"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {spotlight.map(({ row, ui }) => (
              <CustomerBookingCard
                key={row.id}
                bookingId={row.id}
                carLabel={carLabel(row)}
                uiStatus={ui}
                pickupAt={row.pickup_date}
                returnAt={row.return_date}
                pickupLocation={row.pickup_location}
                returnLocation={row.return_location}
                totalRupees={row.total_rupees}
                paymentStatus={row.payment_status}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
