import type { FleetCar, FleetFilterId } from '@/lib/fleet/types'

export function carMatchesFilters(car: FleetCar, active: Set<string>): boolean {
  if (active.size === 0) return true

  const categoryKeys = ['SUV', 'Sedan', 'Hatchback', 'Luxury', 'Budget'] as const
  const activeCats = categoryKeys.filter((k) => active.has(k))
  const activeTrans = (['Automatic', 'Manual'] as const).filter((k) => active.has(k))

  const catOk = activeCats.length === 0 || activeCats.includes(car.category)

  const transOk =
    activeTrans.length === 0 ||
    activeTrans.some((key) =>
      key === 'Automatic' ? car.transmission === 'Auto' : car.transmission === 'Manual',
    )

  return catOk && transOk
}

export function countCarsForFilter(cars: FleetCar[], filterId: FleetFilterId, active: Set<string>): number {
  const simulated = new Set(active)
  if (simulated.has(filterId)) simulated.delete(filterId)
  else simulated.add(filterId)
  return cars.filter((car) => carMatchesFilters(car, simulated)).length
}
