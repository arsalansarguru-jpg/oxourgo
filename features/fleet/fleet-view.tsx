import { getFleetCars } from '@/lib/fleet/get-fleet-cars'
import { FleetClientView } from '@/features/fleet/fleet-client-view'

type FleetViewProps = {
  pickup?: string
  from?: string
  to?: string
}

export async function FleetView({ pickup, from, to }: FleetViewProps) {
  const cars = await getFleetCars()
  return <FleetClientView cars={cars} pickup={pickup} from={from} to={to} />
}
