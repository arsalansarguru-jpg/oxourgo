import 'server-only'

import type { Car } from '@/types/car'
import { fetchPublicVehicleRows, isVehicleShownOnPublicCatalog, logFleetVehiclesError } from '@/lib/fleet/public-vehicle-catalog'
import { mapVehicleRowToCar, type VehicleRow } from '@/lib/fleet/vehicle-mappers'

export type GetFeaturedVehiclesForHomeResult = { ok: true; cars: Car[] } | { ok: false }

function sortFeaturedFirst(rows: VehicleRow[]): VehicleRow[] {
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

/** Featured rows for homepage; prefers `featured`, otherwise latest available vehicles from `public.vehicles`. */
export async function getFeaturedVehiclesForHome(limit = 6): Promise<GetFeaturedVehiclesForHomeResult> {
  const res = await fetchPublicVehicleRows()
  if (!res.ok) return { ok: false }

  const listable = res.rows.filter((r) => isVehicleShownOnPublicCatalog(r))
  const sorted = sortFeaturedFirst(listable).slice(0, limit)

  const cars: Car[] = []
  for (const row of sorted) {
    try {
      cars.push(mapVehicleRowToCar(row))
    } catch (e) {
      logFleetVehiclesError('getFeaturedVehiclesForHome.mapVehicleRowToCar', { id: row.id, error: e })
    }
  }
  return { ok: true, cars }
}
