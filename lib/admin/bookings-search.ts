import 'server-only'

/** Escape `%` and `_` for Postgres ILIKE patterns (user-supplied search). */
export function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}
