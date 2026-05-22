import 'server-only'

import { dedupePublicVehicleRows } from '@/lib/fleet/dedupe-vehicle-rows'
import { fetchPublicVehicleRows, isVehicleShownOnPublicCatalog } from '@/lib/fleet/public-vehicle-catalog'
import type { VehicleRow } from '@/lib/fleet/vehicle-mappers'

/** Shared sort for homepage featured strip and `/fleet` catalog (featured first, then newest). */
export function sortPublicCatalogRows(rows: VehicleRow[]): VehicleRow[] {
  const ts = (iso: string | undefined) => {
    const n = iso ? new Date(iso).getTime() : 0
    return Number.isFinite(n) ? n : 0
  }
  return [...rows].sort((a, b) => {
    const featured = Number(Boolean(b.featured)) - Number(Boolean(a.featured))
    if (featured !== 0) return featured
    return ts(b.created_at) - ts(a.created_at)
  })
}

/**
 * Single listable catalog pipeline for homepage + fleet.
 * Uses anon `public.vehicles` via `fetchPublicVehicleRows` (RLS-compatible, no session).
 */
export async function loadListablePublicVehicleRows(): Promise<VehicleRow[]> {
  const { rows } = await fetchPublicVehicleRows()
  const listable = rows.filter((r) => isVehicleShownOnPublicCatalog(r))
  return sortPublicCatalogRows(dedupePublicVehicleRows(listable))
}
