'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'

/**
 * Branded error boundary for the public marketing route group.
 * Catches client-side rendering errors so visitors never see Next.js's
 * default blank "Application error" screen.
 */
export default function PublicError({
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-electric/90">
          Oxour Go
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-soft sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
          We could not load this page safely. You can retry, head home, or message concierge — bookings stay on
          WhatsApp.
        </p>
        {error?.digest ? (
          <p className="mt-4 font-mono text-[11px] text-muted/70">ref · {error.digest}</p>
        ) : null}
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
