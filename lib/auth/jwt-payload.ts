/**
 * Decode Supabase access-token payload (no signature verification).
 * Used only to read mirrored `app_metadata` / `oxour_role` when `getClaims()` is unavailable.
 */
export function decodeAccessTokenPayload(accessToken: string): Record<string, unknown> | undefined {
  const segment = accessToken.split('.')[1]
  if (!segment) return undefined

  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const json =
      typeof Buffer !== 'undefined'
        ? Buffer.from(padded, 'base64').toString('utf8')
        : atob(padded)
    const parsed: unknown = JSON.parse(json)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined
  } catch {
    return undefined
  }
}
