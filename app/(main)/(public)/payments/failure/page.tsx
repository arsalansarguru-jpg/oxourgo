import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { shouldShowOnlinePaymentsComingSoon } from '@/lib/payments/server'

export const dynamic = 'force-dynamic'

export default async function PaymentFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string; reason?: string }>
}) {
  const sp = await searchParams
  const bookingId = sp.booking?.trim() || null
  const reason = sp.reason?.trim() || null
  const comingSoon = shouldShowOnlinePaymentsComingSoon()

  return (
    <Section className="pt-10 pb-20">
      <div className="mx-auto max-w-lg rounded-3xl border border-red-400/25 bg-red-500/[0.08] p-8 text-center shadow-[var(--shadow-card)]">
        <AlertCircle className="mx-auto h-14 w-14 text-red-300" aria-hidden />
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-soft">Payment not completed</h1>
        {comingSoon ? (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Online checkout is not active yet. Use pay at pickup when booking, or try again after Razorpay is enabled.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {reason || 'Your payment could not be confirmed. You can retry from your booking or choose pay at pickup.'}
          </p>
        )}
        {bookingId ? (
          <p className="mt-2 font-mono text-xs text-muted">Booking {bookingId.slice(0, 8).toUpperCase()}…</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {bookingId ? (
            <Button to={`/dashboard/bookings/${bookingId}`}>Back to booking</Button>
          ) : (
            <Button to="/dashboard/bookings">My bookings</Button>
          )}
          <Button variant="secondary" to="/support">
            Get help
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted">
          Prefer concierge?{' '}
          <Link href="/support" className="font-medium text-electric underline-offset-4 hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </Section>
  )
}
