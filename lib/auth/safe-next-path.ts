/** Internal post-login path only (open redirect safe). */
export function safeNextPath(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback
  return raw
}
