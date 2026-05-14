import { SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'

/**
 * `?error=` from redirects must never echo SQL, Supabase internals, or stack text.
 * Logs suspicious payloads and returns a safe line for display.
 */
export function sanitizeUrlAuthError(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined
  let decoded = raw.trim()
  try {
    decoded = decodeURIComponent(decoded)
  } catch {
    console.error('[sanitizeUrlAuthError] invalid encoding')
    return SAFE_USER_MESSAGE.generic
  }
  if (decoded.length > 200) {
    console.error('[sanitizeUrlAuthError] oversized param')
    return SAFE_USER_MESSAGE.generic
  }
  const t = decoded.toLowerCase()
  if (
    /\b(supabase|postgres|postgrest|sql|rls|constraint|column|relation|exception|undefined|jwt|policy)\b/.test(t)
  ) {
    console.error('[sanitizeUrlAuthError] blocked technical fragment', decoded.slice(0, 120))
    return SAFE_USER_MESSAGE.generic
  }
  return decoded
}
