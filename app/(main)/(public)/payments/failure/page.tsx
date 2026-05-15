import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

import { BRAND } from '@/constants/brand'
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
            Online checkout is not active yet. Message our concierge on WhatsApp to complete your reservation.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {reason || 'Your payment could not be confirmed. Our team can help you finish on WhatsApp.'}
          </p>
        )}
        {bookingId ? (
          <p className="mt-2 font-mono text-xs text-muted">Booking {bookingId.slice(0, 8).toUpperCase()}…</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp concierge
          </Button>
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
