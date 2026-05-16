/** Internal post-login path only (open redirect safe). */
export function safeNextPath(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback
  const q = raw.indexOf('?')
  const pathOnly = q === -1 ? raw : raw.slice(0, q)
  // Web `/booking/*` is concierge-only — never deep-link users into a redirect loop.
  if (pathOnly === '/booking' || pathOnly.startsWith('/booking/')) return '/fleet'
  return raw
}
