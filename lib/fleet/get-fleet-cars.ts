import 'server-only'

import { loadListablePublicVehicleRows } from '@/lib/fleet/load-public-catalog'
import { logFleetRecoverable } from '@/lib/fleet/fleet-catalog-logging'
import type { FleetCar } from '@/lib/fleet/types'
import {
  mapVehicleRowToCar,
  mapVehicleRowToFleetCar,
  modelFromListingName,
  type VehicleRow,
} from '@/lib/fleet/vehicle-mappers'

export type GetFleetCarsResult = { ok: true; cars: FleetCar[] }

/** Map a listable row to `FleetCar`, falling back to the homepage `Car` mapper for parity. */
function mapRowToFleetCar(row: VehicleRow): FleetCar | null {
  try {
    return mapVehicleRowToFleetCar(row)
  } catch (e) {
    logFleetRecoverable('getFleetCars.mapVehicleRowToFleetCar', { id: row.id, error: e })
  }

  try {
    const car = mapVehicleRowToCar(row)
    const listingName = String(row.name ?? '').trim()
    return {
      id: car.id,
      brand: row.brand,
      model: modelFromListingName(row.brand, listingName),
      displayName: car.name,
      year: typeof row.year === 'number' && Number.isFinite(row.year) ? row.year : new Date().getFullYear(),
      registrationNumber: row.registration_number?.trim() || '—',
      fuel: car.fuel === 'CNG' ? 'CNG' : car.fuel === 'Diesel' ? 'Diesel' : car.fuel === 'Electric' ? 'Electric' : car.fuel === 'Hybrid' ? 'Hybrid' : 'Petrol',
      transmission: car.transmission === 'Manual' ? 'Manual' : 'Auto',
      seats: row.seats,
      pricePerDay: car.pricePerDay,
      securityDeposit: car.securityDeposit ?? 0,
      availability: car.status === 'Available' ? 'Available' : 'Unavailable',
      featured: Boolean(car.featured),
      category: car.category as FleetCar['category'],
      imageUrl: car.imageUrl,
      city: row.city,
    }
  } catch (e) {
    logFleetRecoverable('getFleetCars.mapVehicleRowToCarFallback', { id: row.id, error: e })
    return null
  }
}

export async function getFleetCars(): Promise<GetFleetCarsResult> {
  const rows = await loadListablePublicVehicleRows()
  const cars: FleetCar[] = []

  for (const row of rows) {
    const mapped = mapRowToFleetCar(row)
    if (mapped) cars.push(mapped)
  }

  return { ok: true, cars }
}
