import 'server-only'

const TRUTHY = new Set(['1', 'true', 'yes', 'on'])

/**
 * Explicit opt-in for staging / internal hosts (never enable in public production).
 * Set `ENABLE_SUPABASE_DIAGNOSTIC_ROUTE=1` only where diagnostics are required.
 */
export function isSupabaseDiagnosticRouteFlagEnabled(): boolean {
  const v = process.env.ENABLE_SUPABASE_DIAGNOSTIC_ROUTE?.trim().toLowerCase()
  return v ? TRUTHY.has(v) : false
}

function hostnameFromHostHeader(hostHeader: string): string {
  const first = hostHeader.split(',')[0]?.trim() ?? ''
  return first.split(':')[0]?.trim().toLowerCase() ?? ''
}

/** True for loopback-style hosts (e.g. `next start` on this machine). */
export function isLocalDiagnosticHost(hostHeader: string): boolean {
  const host = hostnameFromHostHeader(hostHeader)
  if (!host) return false
  if (host === 'localhost' || host === '127.0.0.1') return true
  if (host === '[::1]' || host === '::1') return true
  if (host.endsWith('.localhost')) return true
  return false
}

/**
 * Whether `/supabase-test` may render. Fail closed: only dev, localhost, or explicit flag.
 */
export function isSupabaseDiagnosticRouteAllowed(hostHeader: string | null | undefined): boolean {
  if (process.env.NODE_ENV === 'development') return true
  if (isSupabaseDiagnosticRouteFlagEnabled()) return true
  if (hostHeader && isLocalDiagnosticHost(hostHeader)) return true
  return false
}
