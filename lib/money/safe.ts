/**
 * Safe monetary parsing — prevents NaN from reaching UI, PDFs, and aggregations.
 */

/** Parses unknown values into a finite whole-rupee integer ≥ 0. */
export function safeRupees(value: unknown, fallback = 0): number {
  if (value == null || value === '') return fallback
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return fallback
    return Math.max(0, Math.round(value))
  }
  const s = String(value).replace(/,/g, '').trim()
  if (!s) return fallback
  const n = Number.parseFloat(s)
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.round(n)
}

/** Alias matching operational spec: Number(value || 0) with NaN guard. */
export function coerceRupees(value: unknown): number {
  return safeRupees(value, 0)
}
