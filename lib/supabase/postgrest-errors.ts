import type { PostgrestError } from '@supabase/supabase-js'

/** PostgREST / Postgres: table or view does not exist (e.g. PGRST205, 42P01). */
export function isMissingRelationError(error: PostgrestError | null | undefined): boolean {
  if (!error) return false
  const code = (error.code ?? '').trim()
  if (code === '42P01' || code === 'PGRST205') return true
  const msg = (error.message ?? '').toLowerCase()
  return msg.includes('does not exist') && (msg.includes('relation') || msg.includes('table'))
}

/** PostgREST: column not found on the resource (e.g. PGRST204). */
export function isMissingColumnError(error: PostgrestError | null | undefined): boolean {
  if (!error) return false
  const code = (error.code ?? '').trim()
  if (code === 'PGRST204' || code === '42703') return true
  const msg = (error.message ?? '').toLowerCase()
  return msg.includes('column') && msg.includes('does not exist')
}

export function isSchemaMismatchError(error: PostgrestError | null | undefined): boolean {
  return isMissingRelationError(error) || isMissingColumnError(error)
}
