import * as Sentry from '@sentry/nextjs'

/** Report infrastructure-level booking failures (no user content, codes only). */
export function reportBookingCreateFailure(code: 'database' | 'rpc_missing'): void {
  Sentry.captureMessage(`booking.create.failed.${code}`, {
    level: 'warning',
    tags: { oxour_domain: 'booking', booking_failure_code: code },
  })
}
