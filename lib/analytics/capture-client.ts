import posthog from 'posthog-js'

import { isPosthogEnabled } from '@/lib/analytics/posthog-env'

const SENSITIVE_KEY = /password|token|secret|authorization|cookie|email|phone|ssn|pan|aadhaar|address|full_name/i

function scrubProps(
  properties?: Record<string, string | number | boolean | null | undefined>,
): Record<string, string | number | boolean> | undefined {
  if (!properties) return undefined
  const out: Record<string, string | number | boolean> = {}
  for (const [k, v] of Object.entries(properties)) {
    if (SENSITIVE_KEY.test(k)) continue
    if (v === null || v === undefined) continue
    if (typeof v === 'string' && v.length > 200) continue
    out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}

/** Typed product analytics (no PII); safe when PostHog is disabled. */
export function captureClientEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (typeof window === 'undefined') return
  if (!isPosthogEnabled()) return
  try {
    const scrubbed = scrubProps(properties)
    posthog.capture(event, scrubbed)
  } catch {
    // never break UX
  }
}

export function identifyClientUser(distinctId: string | null | undefined): void {
  if (typeof window === 'undefined') return
  if (!isPosthogEnabled()) return
  if (!distinctId) return
  try {
    posthog.identify(distinctId)
  } catch {
    // ignore
  }
}

export function resetClientAnalytics(): void {
  if (typeof window === 'undefined') return
  try {
    posthog.reset()
  } catch {
    // ignore
  }
}
