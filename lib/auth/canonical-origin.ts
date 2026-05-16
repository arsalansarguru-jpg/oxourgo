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

/** True when the browser/host should be rewritten to the public marketing domain. */
export function shouldCanonicalizeOrigin(requestOrigin: string): boolean {
  if (!requestOrigin || LOCAL_ORIGIN_RE.test(requestOrigin)) return false
  return requestOrigin.includes('.supabase.co')
}

/**
 * Public site origin for links, OAuth callbacks, and redirects.
 * Prefers NEXT_PUBLIC_SITE_URL (defaults to https://www.oxourgo.com) when the
 * incoming host is a Supabase project URL or otherwise not the canonical domain.
 */
export function getCanonicalSiteOrigin(requestOrigin?: string): string {
  const canonical = parseOrigin(getSiteUrl()) ?? 'https://www.oxourgo.com'

  if (requestOrigin) {
    if (shouldCanonicalizeOrigin(requestOrigin)) return canonical
    const parsed = parseOrigin(requestOrigin)
    if (parsed) return parsed
  }

  return canonical
}
