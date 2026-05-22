/** Admin analytics time windows — business day boundaries use IST (Asia/Kolkata). */

export const ANALYTICS_BUSINESS_TZ = 'Asia/Kolkata'

export type AnalyticsPresetId = 'today' | '7d' | '30d' | '90d' | 'custom'

export type AnalyticsResolvedRange = {
  preset: AnalyticsPresetId
  label: string
  /** Inclusive range for Supabase `gte` / `lte` on `timestamptz` columns */
  startIso: string
  endIso: string
  /** UTC calendar days `YYYY-MM-DD` inclusive */
  startDay: string
  endDay: string
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function toUtcYmd(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

export function utcDayStartIso(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0)).toISOString()
}

export function utcDayEndIso(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999)).toISOString()
}

/** Calendar day in IST as YYYY-MM-DD. */
export function toIstYmd(d = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: ANALYTICS_BUSINESS_TZ })
}

/** Inclusive IST day start as ISO timestamptz. */
export function istDayStartIso(ymd: string): string {
  return new Date(`${ymd}T00:00:00+05:30`).toISOString()
}

/** Inclusive IST day end as ISO timestamptz. */
export function istDayEndIso(ymd: string): string {
  return new Date(`${ymd}T23:59:59.999+05:30`).toISOString()
}

/** Inclusive IST calendar day list from `startDay` to `endDay` (YYYY-MM-DD). */
export function enumerateIstDays(startDay: string, endDay: string): string[] {
  const out: string[] = []
  const a = new Date(istDayStartIso(startDay))
  const end = new Date(istDayEndIso(endDay))
  for (let t = a.getTime(); t <= end.getTime(); t += 24 * 60 * 60 * 1000) {
    out.push(toIstYmd(new Date(t)))
  }
  return out
}

/** Inclusive UTC day list from `startDay` to `endDay` (YYYY-MM-DD). */
export function enumerateUtcDays(startDay: string, endDay: string): string[] {
  const out: string[] = []
  const a = new Date(utcDayStartIso(startDay))
  const end = new Date(utcDayEndIso(endDay))
  for (let t = a.getTime(); t <= end.getTime(); t += 24 * 60 * 60 * 1000) {
    out.push(toUtcYmd(new Date(t)))
  }
  return out
}

const PRESET_LABEL: Record<Exclude<AnalyticsPresetId, 'custom'>, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
}

function isYmd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim())
}

function parseYmdToUtc(s: string): Date | null {
  if (!isYmd(s)) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0))
  return Number.isNaN(dt.getTime()) ? null : dt
}

/**
 * Resolve dashboard range from URL search params (`preset`, optional `from` / `to` for custom).
 * Defaults to **30d**. Unknown preset → 30d.
 */
export function resolveAnalyticsRangeFromSearchParams(
  raw: Record<string, string | string[] | undefined>,
): AnalyticsResolvedRange {
  const presetRaw = typeof raw.preset === 'string' ? raw.preset.trim().toLowerCase() : ''
  const preset: AnalyticsPresetId =
    presetRaw === 'today' || presetRaw === '7d' || presetRaw === '30d' || presetRaw === '90d' || presetRaw === 'custom'
      ? (presetRaw as AnalyticsPresetId)
      : '30d'

  const now = new Date()
  const endDay = toIstYmd(now)

  if (preset === 'custom') {
    const from = typeof raw.from === 'string' ? raw.from.trim() : ''
    const to = typeof raw.to === 'string' ? raw.to.trim() : ''
    const df = parseYmdToUtc(from)
    const dt = parseYmdToUtc(to)
    if (df && dt && df.getTime() <= dt.getTime()) {
      const startDay = toIstYmd(df)
      const endDayCustom = toIstYmd(dt)
      return {
        preset: 'custom',
        label: `${startDay} → ${endDayCustom} (IST)`,
        startIso: istDayStartIso(startDay),
        endIso: istDayEndIso(endDayCustom),
        startDay,
        endDay: endDayCustom,
      }
    }
    // fall through if custom invalid
  }

  let startDay = endDay
  if (preset === 'today') {
    startDay = endDay
  } else if (preset === '7d') {
    const t = new Date(istDayStartIso(endDay))
    t.setUTCDate(t.getUTCDate() - 6)
    startDay = toIstYmd(t)
  } else if (preset === '30d') {
    const t = new Date(istDayStartIso(endDay))
    t.setUTCDate(t.getUTCDate() - 29)
    startDay = toIstYmd(t)
  } else if (preset === '90d') {
    const t = new Date(istDayStartIso(endDay))
    t.setUTCDate(t.getUTCDate() - 89)
    startDay = toIstYmd(t)
  } else {
    const t = new Date(istDayStartIso(endDay))
    t.setUTCDate(t.getUTCDate() - 29)
    startDay = toIstYmd(t)
  }

  const safePreset: AnalyticsPresetId = preset === 'custom' ? '30d' : preset

  return {
    preset: safePreset,
    label: `${PRESET_LABEL[safePreset as Exclude<AnalyticsPresetId, 'custom'>] ?? 'Last 30 days'} (IST)`,
    startIso: istDayStartIso(startDay),
    endIso: istDayEndIso(endDay),
    startDay,
    endDay,
  }
}

/** First day of current calendar month in IST (YYYY-MM-DD). */
export function istMonthStartYmd(d = new Date()): string {
  const ymd = toIstYmd(d)
  return `${ymd.slice(0, 7)}-01`
}

/** Inclusive IST month start as ISO timestamptz. */
export function istMonthStartIso(d = new Date()): string {
  return istDayStartIso(istMonthStartYmd(d))
}

/** Last 7 days inclusive in IST (for dashboard overview charts). */
export function analyticsRange7dIst(): AnalyticsResolvedRange {
  const now = new Date()
  const endDay = toIstYmd(now)
  const t = new Date(istDayStartIso(endDay))
  t.setUTCDate(t.getUTCDate() - 6)
  const startDay = toIstYmd(t)
  return {
    preset: '7d',
    label: 'Last 7 days (IST)',
    startIso: istDayStartIso(startDay),
    endIso: istDayEndIso(endDay),
    startDay,
    endDay,
  }
}

/** Build `/admin/analytics` query string for filter navigation. */
export function buildAnalyticsHref(input: { preset: AnalyticsPresetId; from?: string; to?: string }) {
  const p = new URLSearchParams()
  p.set('preset', input.preset)
  if (input.preset === 'custom' && input.from && input.to) {
    p.set('from', input.from)
    p.set('to', input.to)
  }
  return `/admin/analytics?${p.toString()}`
}
