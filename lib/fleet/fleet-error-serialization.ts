import type { PostgrestError } from '@supabase/supabase-js'

/** Safe, loggable shape — never forward raw SQL or stack traces to the client. */
export type FleetSerializedError = {
  kind: 'postgrest' | 'native' | 'unknown'
  message?: string
  code?: string
  details?: string
  hint?: string
  name?: string
}

const MAX_DETAIL_LEN = 240

function truncateDetail(s: string | null | undefined): string | undefined {
  if (s == null || !String(s).trim()) return undefined
  const t = String(s).trim()
  if (t.length <= MAX_DETAIL_LEN) return t
  return `${t.slice(0, MAX_DETAIL_LEN)}…`
}

function isPostgrestShape(x: unknown): x is PostgrestError {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.message === 'string' || typeof o.code === 'string'
}

/** Serialize unknown failures for server logs only (no secrets). */
export function serializeFleetErrorDetail(detail: unknown): FleetSerializedError | null {
  if (detail == null) return null

  if (isPostgrestShape(detail)) {
    const e = detail as PostgrestError
    return {
      kind: 'postgrest',
      message: e.message?.trim() || undefined,
      code: e.code?.trim() || undefined,
      details: truncateDetail(e.details ?? undefined),
      hint: truncateDetail(e.hint ?? undefined),
    }
  }

  if (detail instanceof Error) {
    const cause = (detail as Error & { cause?: unknown }).cause
    const causeStr =
      cause != null && typeof cause !== 'object'
        ? String(cause)
        : cause instanceof Error
          ? cause.message
          : undefined
    const msg = [detail.message, causeStr].filter(Boolean).join(' | ').trim()
    return {
      kind: 'native',
      name: detail.name,
      message: msg || undefined,
    }
  }

  if (typeof detail === 'string') {
    const m = detail.trim()
    return m ? { kind: 'unknown', message: truncateDetail(m) } : null
  }

  if (typeof detail === 'object') {
    try {
      const keys = Object.keys(detail as object)
      if (keys.length === 0) return null
      const raw = JSON.stringify(detail)
      const truncated = raw.length > MAX_DETAIL_LEN ? `${raw.slice(0, MAX_DETAIL_LEN)}…` : raw
      return { kind: 'unknown', message: truncated }
    } catch {
      return { kind: 'unknown', message: '[unserializable object]' }
    }
  }

  return { kind: 'unknown', message: String(detail).trim() || undefined }
}

/** True when there is nothing useful to emit (skip console entirely). */
export function fleetSerializedErrorIsMeaningful(s: FleetSerializedError | null): boolean {
  if (!s) return false
  const parts = [s.message, s.code, s.details, s.hint, s.name].filter((x) => typeof x === 'string' && x.trim().length > 0)
  return parts.length > 0
}
