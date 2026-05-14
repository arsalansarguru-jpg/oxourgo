/** Admin analytics time windows (UTC boundaries for consistent server + chart bucketing). */

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

  if (preset === 'custom') {
    const from = typeof raw.from === 'string' ? raw.from.trim() : ''
    const to = typeof raw.to === 'string' ? raw.to.trim() : ''
    const df = parseYmdToUtc(from)
    const dt = parseYmdToUtc(to)
    if (df && dt && df.getTime() <= dt.getTime()) {
      const startDay = toUtcYmd(df)
      const endDay = toUtcYmd(dt)
      return {
        preset: 'custom',
        label: `${startDay} → ${endDay}`,
        startIso: utcDayStartIso(startDay),
        endIso: utcDayEndIso(endDay),
        startDay,
        endDay,
      }
    }
    // fall through if custom invalid
  }

  const endDay = toUtcYmd(now)
  let startDay = endDay
  if (preset === 'today') {
    startDay = endDay
  } else if (preset === '7d') {
    const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6, 12, 0, 0, 0))
    startDay = toUtcYmd(t)
  } else if (preset === '30d') {
    const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29, 12, 0, 0, 0))
    startDay = toUtcYmd(t)
  } else if (preset === '90d') {
    const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 89, 12, 0, 0, 0))
    startDay = toUtcYmd(t)
  } else {
    const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29, 12, 0, 0, 0))
    startDay = toUtcYmd(t)
  }

  const safePreset: AnalyticsPresetId = preset === 'custom' ? '30d' : preset

  return {
    preset: safePreset,
    label: PRESET_LABEL[safePreset as Exclude<AnalyticsPresetId, 'custom'>] ?? 'Last 30 days',
    startIso: utcDayStartIso(startDay),
    endIso: utcDayEndIso(endDay),
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
