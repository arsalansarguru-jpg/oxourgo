import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { shouldShowOnlinePaymentsComingSoon } from '@/lib/payments/server'

export const dynamic = 'force-dynamic'

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>
}) {
  const sp = await searchParams
  const bookingId = sp.booking?.trim() || null
  const comingSoon = shouldShowOnlinePaymentsComingSoon()

  return (
    <Section className="pt-10 pb-20">
      <div className="mx-auto max-w-lg rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.08] p-8 text-center shadow-[var(--shadow-card)]">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald" aria-hidden />
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-soft">Payment received</h1>
        {comingSoon ? (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Online checkout is not active yet — this page is ready for when Razorpay goes live.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Thank you. Your payment is being confirmed — check your dashboard for status updates.
          </p>
        )}
        {bookingId ? (
          <p className="mt-2 font-mono text-xs text-muted">Booking {bookingId.slice(0, 8).toUpperCase()}…</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {bookingId ? (
            <Button to={`/dashboard/bookings/${bookingId}`}>View booking</Button>
          ) : (
            <Button to="/dashboard/bookings">My bookings</Button>
          )}
          <Button variant="secondary" to="/fleet">
            Fleet
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted">
          Questions?{' '}
          <Link href="/support" className="font-medium text-electric underline-offset-4 hover:underline">
            Contact concierge
          </Link>
        </p>
      </div>
    </Section>
  )
}
