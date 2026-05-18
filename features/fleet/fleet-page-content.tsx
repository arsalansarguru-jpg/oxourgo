import { FleetView } from '@/features/fleet/fleet-view'
import { getFleetCars } from '@/lib/fleet/get-fleet-cars'

type FleetPageContentProps = {
  from?: string
  to?: string
  location?: string
  searchQuery?: string
}

/** Server fetch for `/fleet` — same catalog pipeline as the homepage featured strip. */
export async function FleetPageContent({
  from,
  to,
  location,
  searchQuery,
}: FleetPageContentProps) {
  const { cars } = await getFleetCars()

  return (
    <FleetView
      cars={cars}
      from={from}
      to={to}
      location={location}
      searchQuery={searchQuery}
    />
  )
}
