import { getSiteUrl } from '@/lib/env/site-url'

const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i

function parseOrigin(value: string): string | null {
  try {
    const href = value.startsWith('http') ? value : `https://${value}`
    return new URL(href).origin
  } catch {
    return null
  }
}

function canonicalOrigin(): string {
  return parseOrigin(getSiteUrl()) ?? 'https://www.oxourgo.com'
}

/** True for localhost / 127.0.0.1 — OAuth may use the browser origin in dev only. */
export function isLocalDevOrigin(origin: string): boolean {
  return Boolean(origin && LOCAL_ORIGIN_RE.test(origin))
}

/**
 * Origin used for OAuth / magic-link `redirectTo` URLs.
 * Production always resolves to NEXT_PUBLIC_SITE_URL (default https://www.oxourgo.com).
 * Local dev uses the active browser origin (e.g. http://localhost:3000).
 */
export function getAuthCallbackOrigin(requestOrigin?: string): string {
  const canonical = canonicalOrigin()
  if (requestOrigin && isLocalDevOrigin(requestOrigin)) {
    return parseOrigin(requestOrigin) ?? requestOrigin
  }
  return canonical
}

/** True when the browser/host should be rewritten to the public marketing domain. */
export function shouldCanonicalizeOrigin(requestOrigin: string): boolean {
  if (!requestOrigin || isLocalDevOrigin(requestOrigin)) return false
  if (requestOrigin.includes('.supabase.co')) return true
  const canonical = canonicalOrigin()
  const parsed = parseOrigin(requestOrigin)
  if (parsed && parsed !== canonical) return true
  return false
}

/**
 * Public site origin for links, post-login redirects, and middleware.
 * Rewrites Supabase project hosts and non-canonical production hosts (e.g. apex vs www).
 */
export function getCanonicalSiteOrigin(requestOrigin?: string): string {
  const canonical = canonicalOrigin()

  if (requestOrigin) {
    if (shouldCanonicalizeOrigin(requestOrigin)) return canonical
    const parsed = parseOrigin(requestOrigin)
    if (parsed) return parsed
  }

  return canonical
}
