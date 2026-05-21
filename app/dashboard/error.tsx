'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <Section className="py-16 md:py-24">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-[-0.03em] text-soft md:text-2xl">Dashboard unavailable</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We could not load this page safely. You can retry, go home, or message concierge — bookings stay on WhatsApp.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={() => reset()}>
            Try again
          </Button>
          <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto" to="/">
            Home
          </Button>
          <WhatsAppInquiryButton className="min-h-11 w-full sm:w-auto" label="Book on WhatsApp" />
        </div>
      </div>
    </Section>
  )
}
