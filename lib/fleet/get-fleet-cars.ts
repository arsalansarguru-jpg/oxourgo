import 'server-only'

import { fetchPublicVehicleRows, isVehicleShownOnPublicCatalog } from '@/lib/fleet/public-vehicle-catalog'
import { logFleetRecoverable } from '@/lib/fleet/fleet-catalog-logging'
import type { FleetCar } from '@/lib/fleet/types'
import { mapVehicleRowToFleetCar, type VehicleRow } from '@/lib/fleet/vehicle-mappers'

export type GetFleetCarsResult = { ok: true; cars: FleetCar[] }

function sortFleetRows(rows: VehicleRow[]): VehicleRow[] {
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

export async function getFleetCars(): Promise<GetFleetCarsResult> {
  const { rows } = await fetchPublicVehicleRows()
  const listable = rows.filter((r) => isVehicleShownOnPublicCatalog(r))
  const sorted = sortFleetRows(listable)

  const cars: FleetCar[] = []
  for (const row of sorted) {
    try {
      cars.push(mapVehicleRowToFleetCar(row))
    } catch (e) {
      logFleetRecoverable('getFleetCars.mapVehicleRowToFleetCar', { id: row.id, error: e })
    }
  }
  return { ok: true, cars }
}
