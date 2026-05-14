import 'server-only'

import type { PostgrestError } from '@supabase/supabase-js'

import { logPostgrestError } from '@/lib/errors/safe-user-message'

/** Stable codes for admin loader failures (logs carry Postgrest details). */
export type AdminLoaderErrorCode = 'admin_fleet_count' | 'admin_fleet_list'

const LOADER_MESSAGES: Record<AdminLoaderErrorCode, string> = {
  admin_fleet_count: 'Could not load fleet totals. Please refresh and try again.',
  admin_fleet_list: 'Could not load the vehicle list. Please refresh and try again.',
}

/**
 * Thrown when a PostgREST read fails in admin data loaders. `message` is safe for operator UI.
 * Raw `PostgrestError` is never assigned to `message` — use {@link logPostgrestError} before throwing.
 */
export class AdminDataLoadError extends Error {
  readonly code: AdminLoaderErrorCode

  constructor(code: AdminLoaderErrorCode, message?: string) {
    super(message ?? LOADER_MESSAGES[code])
    this.name = 'AdminDataLoadError'
    this.code = code
  }
}

export function isAdminDataLoadError(error: unknown): error is AdminDataLoadError {
  return error instanceof AdminDataLoadError
}

/** Prefer {@link AdminDataLoadError} message when present; otherwise a generic admin-safe line. */
export function getAdminLoaderUiMessage(error: unknown, fallback: string): string {
  if (isAdminDataLoadError(error)) return error.message
  return fallback
}

export function assertNoPostgrestError(
  scope: string,
  error: PostgrestError | null,
  code: AdminLoaderErrorCode,
): asserts error is null {
  if (!error) return
  logPostgrestError(scope, error)
  throw new AdminDataLoadError(code)
}
