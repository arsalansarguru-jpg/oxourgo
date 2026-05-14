import type { PostgrestError } from '@supabase/supabase-js'

/** Copy safe to show in any customer or admin UI (no SQL, stacks, or schema hints). */
export const SAFE_USER_MESSAGE = {
  generic: 'Something went wrong. Please try again later.',
  load: 'Unable to load data. Please try again later.',
  save: 'Could not save your changes. Please try again later.',
  unauthorized: 'Please sign in to continue.',
  availability: 'Unable to verify availability. Please try again later.',
} as const

export function logPostgrestError(scope: string, error: PostgrestError): void {
  console.error(`[${scope}]`, error.message, error.code, error.details, error.hint)
}

export function logUnknownError(scope: string, error: unknown): void {
  console.error(`[${scope}]`, error)
}

/** Admin / server actions: log Postgrest row, return opaque copy for UI. */
export function adminActionDbFailed(scope: string, error: PostgrestError): { ok: false; message: string } {
  logPostgrestError(scope, error)
  return { ok: false, message: SAFE_USER_MESSAGE.generic }
}
