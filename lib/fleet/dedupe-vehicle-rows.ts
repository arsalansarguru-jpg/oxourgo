import type { VehicleRow } from '@/lib/fleet/vehicle-mappers'

function catalogDedupeKey(row: VehicleRow): string {
  const reg = row.registration_number?.trim().toLowerCase()
  if (reg) return `reg:${reg}`
  const brand = row.brand?.trim().toLowerCase() ?? ''
  const name = row.name?.trim().toLowerCase() ?? ''
  return `model:${brand}|${name}`
}

/**
 * Keeps one row per registration (or brand+name when registration is empty).
 * Prefers featured vehicles, then newest `created_at`.
 */
export function dedupePublicVehicleRows(rows: VehicleRow[]): VehicleRow[] {
  const ts = (iso: string | undefined) => {
    const n = iso ? new Date(iso).getTime() : 0
    return Number.isFinite(n) ? n : 0
  }

  const sorted = [...rows].sort((a, b) => {
    const featured = Number(Boolean(b.featured)) - Number(Boolean(a.featured))
    if (featured !== 0) return featured
    return ts(b.created_at) - ts(a.created_at)
  })

  const seen = new Set<string>()
  const out: VehicleRow[] = []
  for (const row of sorted) {
    const key = catalogDedupeKey(row)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return out
}
