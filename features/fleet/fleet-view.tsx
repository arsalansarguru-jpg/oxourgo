import { getFleetCars } from '@/lib/fleet/get-fleet-cars'
import { FleetClientView } from '@/features/fleet/fleet-client-view'

type FleetViewProps = {
  pickup?: string
  from?: string
  to?: string
}

export async function FleetView({ pickup, from, to }: FleetViewProps) {
  const result = await getFleetCars()
  return (
    <FleetClientView
      cars={result.ok ? result.cars : []}
      fetchError={result.ok ? null : result.error}
      pickup={pickup}
      from={from}
      to={to}
    />
  )
}
