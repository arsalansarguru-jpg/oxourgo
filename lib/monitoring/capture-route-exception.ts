import * as Sentry from '@sentry/nextjs'

import type { OxourSentryDomain } from '@/lib/monitoring/sentry-domains'

export function captureRouteException(domain: OxourSentryDomain, routeLabel: string, err: unknown): void {
  const error = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Unknown error')
  Sentry.captureException(error, {
    tags: { oxour_domain: domain, route: routeLabel },
  })
}
