import 'server-only'

import type { Car } from '@/types/car'
import { loadListablePublicVehicleRows } from '@/lib/fleet/load-public-catalog'
import { logFleetRecoverable } from '@/lib/fleet/fleet-catalog-logging'
import { mapVehicleRowToCar } from '@/lib/fleet/vehicle-mappers'

export type GetFeaturedVehiclesForHomeResult = { ok: true; cars: Car[] }

/** Featured rows for homepage; same catalog pipeline as `/fleet`, capped for the hero grid. */
export async function getFeaturedVehiclesForHome(limit = 6): Promise<GetFeaturedVehiclesForHomeResult> {
  const rows = await loadListablePublicVehicleRows()
  const slice = rows.slice(0, limit)

  const cars: Car[] = []
  for (const row of slice) {
    try {
      cars.push(mapVehicleRowToCar(row))
    } catch (e) {
      logFleetRecoverable('getFeaturedVehiclesForHome.mapVehicleRowToCar', { id: row.id, error: e })
    }
  }
  return { ok: true, cars }
}
