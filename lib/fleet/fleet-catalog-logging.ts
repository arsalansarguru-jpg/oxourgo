import {
  fleetSerializedErrorIsMeaningful,
  serializeFleetErrorDetail,
  type FleetSerializedError,
} from '@/lib/fleet/fleet-error-serialization'

const PREFIX = '[oxour-go/fleet]'

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/** Benign empty Postgrest payloads (SDK noise) — never log. */
function isBenignEmptyPostgrest(s: FleetSerializedError): boolean {
  if (s.kind !== 'postgrest') return false
  const has =
    (s.message && s.message.trim().length > 0) ||
    (s.code && s.code.trim().length > 0) ||
    (s.details && s.details.trim().length > 0) ||
    (s.hint && s.hint.trim().length > 0)
  return !has
}

function emit(scope: string, payload: FleetSerializedError, level: 'warn' | 'error'): void {
  const line = `${PREFIX} ${scope}`
  if (level === 'warn') {
    console.warn(line, payload)
  } else {
    console.error(line, payload)
  }
}

/**
 * Recoverable fleet issues (empty catalog fallback, mapping skips, lookup misses).
 * Uses `console.warn` and skips empty / benign payloads. In production, suppresses hollow Postgrest objects.
 */
export function logFleetRecoverable(scope: string, detail: unknown): void {
  const payload = serializeFleetErrorDetail(detail)
  if (!payload || !fleetSerializedErrorIsMeaningful(payload)) return
  if (isProduction() && isBenignEmptyPostgrest(payload)) return
  emit(scope, payload, 'warn')
}

/**
 * Unexpected failures that should surface in ops logs (still no raw DB text to end users).
 */
export function logFleetActionable(scope: string, detail: unknown): void {
  const payload = serializeFleetErrorDetail(detail)
  if (!payload || !fleetSerializedErrorIsMeaningful(payload)) return
  emit(scope, payload, 'error')
}

/** @deprecated Prefer `logFleetRecoverable` / `logFleetActionable`. */
export function logFleetVehiclesError(scope: string, detail: unknown): void {
  logFleetRecoverable(scope, detail)
}
