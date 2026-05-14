import 'server-only'

import * as Sentry from '@sentry/nextjs'
import { headers } from 'next/headers'

import type { OxourSentryDomain } from '@/lib/monitoring/sentry-domains'

/**
 * Wraps a server action body for Sentry (tracing + errors). Does not attach FormData or responses
 * (`recordResponse: false`) to avoid leaking sensitive booking or PII payloads.
 */
export async function runInstrumentedServerAction<TResult>(
  actionName: string,
  domain: OxourSentryDomain,
  fn: () => Promise<TResult>,
): Promise<TResult> {
  const h = await headers()
  return Sentry.withServerActionInstrumentation(
    actionName,
    { headers: h, recordResponse: false },
    async () => {
      Sentry.getCurrentScope().setTag('oxour_domain', domain)
      return fn()
    },
  )
}
