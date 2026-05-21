'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'

export default function DashboardKycError({
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
    <Section className="py-12 md:py-16">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-[-0.03em] text-soft md:text-2xl">KYC center unavailable</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We could not load verification safely. You can retry or return to your dashboard — your bookings are unchanged.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={() => reset()}>
            Try again
          </Button>
          <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto" to="/dashboard">
            Back to dashboard
          </Button>
        </div>
      </div>
    </Section>
  )
}
