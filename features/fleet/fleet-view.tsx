import { getFleetCars } from '@/lib/fleet/get-fleet-cars'
import { FleetClientView } from '@/features/fleet/fleet-client-view'

type FleetViewProps = {
  pickup?: string
  from?: string
  to?: string
  location?: string
  /** Keyword prefill for fleet text search (homepage / deep links). */
  searchQuery?: string
}

export async function FleetView({ pickup, from, to, location, searchQuery }: FleetViewProps) {
  const result = await getFleetCars()
  return (
    <FleetClientView
      cars={result.ok ? result.cars : []}
      loadFailed={!result.ok}
      pickup={pickup}
      from={from}
      to={to}
      location={location}
      searchQuery={searchQuery}
    />
  )
}
