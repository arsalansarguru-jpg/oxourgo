import * as Sentry from '@sentry/nextjs'

import type { OxourSentryDomain } from '@/lib/monitoring/sentry-domains'

type RouteHandlerContext = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
  parameterizedRoute: string
}

/** App Router route handler + Sentry span/errors + `oxour_domain` tag. */
export function oxourWrapRouteHandler<P extends unknown[], R>(
  context: RouteHandlerContext,
  domain: OxourSentryDomain,
  handler: (...args: P) => Promise<R>,
): (...args: P) => Promise<R> {
  const inner = (async (...args: P) => {
    Sentry.getCurrentScope().setTag('oxour_domain', domain)
    return handler(...args)
  }) as (...args: P) => Promise<R>

  return Sentry.wrapRouteHandlerWithSentry(inner, context) as (...args: P) => Promise<R>
}
