import type { Breadcrumb, ErrorEvent, EventHint } from '@sentry/core'

const SENSITIVE_HEADER_RE = /^(cookie|authorization|set-cookie|x-api-key|x-supabase|x-vercel)/i

function scrubHeaders(h: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!h) return h
  const next: Record<string, string> = {}
  for (const [k, v] of Object.entries(h)) {
    if (SENSITIVE_HEADER_RE.test(k)) continue
    next[k] = v
  }
  return next
}

/**
 * Strip PII-ish fields before upload. `sendDefaultPii` stays false; this is defense in depth.
 */
export function scrubSentryEvent(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  void hint
  event.user = undefined

  if (event.request) {
    event.request.cookies = undefined
    if (event.request.headers) {
      event.request.headers = scrubHeaders(event.request.headers as Record<string, string>) as typeof event.request.headers
    }
    if (event.request.data && typeof event.request.data === 'string') {
      const s = event.request.data
      if (s.length > 4_000) event.request.data = `${s.slice(0, 4_000)}…[truncated]`
    }
  }

  return event
}

export function scrubSentryBreadcrumb(crumb: Breadcrumb): Breadcrumb | null {
  if (crumb.category === 'console' && process.env.NODE_ENV === 'production') {
    if (crumb.level === 'log' || crumb.level === 'debug') return null
  }
  return crumb
}
