import Link from 'next/link'
import { ArrowUpRight, Car, CreditCard, ShieldCheck, Sparkles } from 'lucide-react'

import type { BookingWithCar } from '@/lib/supabase/database.types'
import { deriveCustomerBookingUiStatus } from '@/lib/customer/derive-booking-ui-status'
import { formatBookingVehicleTitle } from '@/lib/customer/booking-display'
import { isPostedRentalPayment } from '@/lib/payments/booking-payment'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cardSurfaceBase, cardSurfaceHover, cardSurfaceTransition } from '@/components/ui/card-tokens'
import { CustomerBookingCard } from '@/components/dashboard/customer-booking-card'
import { EmptyState } from '@/components/ui/EmptyState'
import { KycStatusBadge } from '@/components/kyc/kyc-status-badge'

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

function isPostedPayment(paymentStatus: string): boolean {
  return isPostedRentalPayment(paymentStatus)
}

export function CustomerDashboardHome({
  bookings,
  kycUploadedCount,
  verificationTier,
  kycStatus,
  bookingCleared,
  accessNotice,
}: {
  bookings: BookingWithCar[]
  kycUploadedCount: number
  verificationTier: string
  kycStatus: string
  bookingCleared: boolean
  /** Shown when middleware redirects a non-admin away from `/admin`. */
  accessNotice?: string | null
}) {
  const now = Date.now()
  const withUi = bookings.map((b) => ({ row: b, ui: deriveCustomerBookingUiStatus(b) }))

  const active = withUi.filter(({ ui, row }) => ui === 'active' || (ui === 'upcoming' && new Date(row.pickup_date).getTime() <= now + 36 * 60 * 60 * 1000))
  /** Matches `/dashboard/bookings` partition: pending payment + future confirmed. */
  const upcoming = withUi.filter(({ ui }) => ui === 'upcoming' || ui === 'pending_review')
  const spotlight = [...active, ...upcoming].slice(0, 3)

  const postedSpend = bookings
    .filter((b) => b.booking_status !== 'cancelled' && isPostedPayment(b.payment_status))
    .reduce((s, b) => s + Math.max(0, Number(b.amount_paid ?? 0)), 0)

  const pendingPaymentBookings = bookings.filter((b) => {
    const p = b.payment_status.trim().toLowerCase()
    const due = Math.max(0, Number(b.amount_due ?? 0))
    return b.booking_status === 'pending_payment' || p === 'pending' || (p === 'partial' && due > 0)
  }).length

  const isVerified = bookingCleared

  return (
    <div className="space-y-10">
      {accessNotice ? (
        <div
          role="status"
          className="rounded-xl border border-amber-400/25 bg-amber-500/[0.06] px-4 py-3 text-sm text-soft"
        >
          {accessNotice}
        </div>
      ) : null}
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Command center</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-soft md:text-[2rem]">Your Oxour journey</h1>
          <KycStatusBadge status={kycStatus} className="shrink-0" />
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Live bookings, verification, and payments — orchestrated for Mumbai self-drive with concierge-grade polish.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active trips" value={String(withUi.filter((x) => x.ui === 'active').length)} hint="On the road now" />
        <Stat
          label="Upcoming & pending"
          value={String(upcoming.length)}
          hint="Includes payment-pending and confirmed ahead"
        />
        <Stat label="Posted spend" value={formatInr(postedSpend)} hint="Rental amounts recorded as collected" />
        <Stat
          label="Verification"
          value={isVerified ? 'Cleared' : 'In progress'}
          hint={`${kycUploadedCount} file(s) · tier ${verificationTier}`}
        />
      </div>

      <div
        className={cn(
          'flex flex-col gap-4 rounded-2xl border border-electric/20 bg-gradient-to-br from-electric/[0.12] via-transparent to-fill-glass p-5 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-6',
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stroke-strong bg-matte/50">
            <Sparkles className="h-5 w-5 text-electric" aria-hidden />
          </div>
          <div>
            <p className="font-medium text-soft">Quick actions</p>
            <p className="mt-1 text-sm text-muted">
              {pendingPaymentBookings > 0
                ? `You have ${pendingPaymentBookings} booking${pendingPaymentBookings === 1 ? '' : 's'} awaiting payment — open Payments or the booking to continue.`
                : !isVerified
                  ? kycStatus === 'rejected'
                    ? 'A document was not accepted — open KYC Center for the reviewer note and upload replacements.'
                    : kycStatus === 'pending'
                      ? 'Your documents are with operations. We will email you when verification clears and bookings unlock.'
                      : 'Upload identity documents to unlock bookings once operations approves your profile.'
                  : 'Book, verify identity, or review payments in one tap.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {pendingPaymentBookings > 0 ? (
            <Button to="/dashboard/payments" className="min-h-11">
              <CreditCard className="mr-1.5 h-4 w-4" aria-hidden />
              Complete payment
            </Button>
          ) : null}
          <Button to="/fleet" className="min-h-11">
            Book a vehicle
          </Button>
          {!isVerified ? (
            <Button variant="secondary" to="/dashboard/kyc" className="min-h-11">
              <ShieldCheck className="mr-1.5 h-4 w-4" aria-hidden />
              KYC center
            </Button>
          ) : null}
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
          <div className={cn(cardSurfaceBase, 'rounded-2xl border border-stroke p-6 sm:rounded-3xl')}>
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
                carLabel={formatBookingVehicleTitle(row)}
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
