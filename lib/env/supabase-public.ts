/**
 * Public Supabase configuration (safe to expose to the browser).
 * In server code that must fail fast when misconfigured, use `requireSupabasePublicEnv()`.
 */

export type SupabasePublicEnv = {
  /** Project URL only, e.g. https://<ref>.supabase.co */
  url: string
  /**
   * Legacy anon JWT (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) or new publishable key
   * (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
   */
  anonKey: string
}

const TRAILING_SLASH = /\/+$/
const REST_V1_SUFFIX = /\/rest\/v1\/?$/i

/** Normalizes common mis-pastes (trailing slash, `/rest/v1`). */
export function normalizeSupabaseProjectUrl(raw: string): string {
  let url = raw.trim().replace(TRAILING_SLASH, '')
  url = url.replace(REST_V1_SUFFIX, '')
  return url.replace(TRAILING_SLASH, '')
}

export function readSupabasePublicEnv(): SupabasePublicEnv | null {
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!urlRaw?.trim()) return null

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!anonKey) return null

  return {
    url: normalizeSupabaseProjectUrl(urlRaw),
    anonKey,
  }
}

export function requireSupabasePublicEnv(): SupabasePublicEnv {
  const env = readSupabasePublicEnv()
  if (!env) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).',
    )
  }
  return env
}

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  return readSupabasePublicEnv()
}
