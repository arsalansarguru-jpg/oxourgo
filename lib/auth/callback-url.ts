import { getAuthCallbackOrigin } from '@/lib/auth/canonical-origin'

/** Must match Supabase Dashboard → Authentication → Redirect URLs. */
export const AUTH_CALLBACK_PATH = '/auth/callback'

/**
 * Production default — https://www.oxourgo.com/auth/callback (plus optional `next`).
 * Local dev uses http://localhost:3000/auth/callback when running on localhost.
 */
export function getOAuthCallbackUrl(nextPath = '/dashboard', requestOrigin?: string): string {
  const origin = getAuthCallbackOrigin(requestOrigin)
  return buildAuthCallbackUrl(origin, nextPath)
}

/**
 * Builds the OAuth / magic-link return URL. Must match entries in Supabase Dashboard
 * → Authentication → URL Configuration → Redirect URLs.
 */
export function buildAuthCallbackUrl(origin: string, nextPath = '/dashboard'): string {
  const next = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/dashboard'
  const base = origin.replace(/\/$/, '')
  return `${base}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(next)}`
}
