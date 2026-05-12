/**
 * Builds the OAuth / magic-link return URL. Must match entries in Supabase Dashboard
 * → Authentication → URL Configuration → Redirect URLs.
 */
export function buildAuthCallbackUrl(origin: string, nextPath = '/dashboard'): string {
  const path = '/auth/callback'
  const next = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/dashboard'
  return `${origin.replace(/\/$/, '')}${path}?next=${encodeURIComponent(next)}`
}
