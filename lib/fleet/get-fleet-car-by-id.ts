import 'server-only'

import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server-client'
import type { Car } from '@/types/car'
import { mapVehicleRowToCar, type VehicleRow } from '@/lib/fleet/vehicle-mappers'
import { logFleetVehiclesError } from '@/lib/fleet/public-vehicle-catalog'

/** Public booking / detail vehicle by `vehicles.id`. */
export async function getFleetCarById(id: string): Promise<Car | null> {
  try {
    const publicSupabase = createPublicServerSupabaseClient()
    const { data: v, error: vErr } = await publicSupabase.from('vehicles').select('*').eq('id', id).maybeSingle()
    if (vErr) {
      logFleetVehiclesError('getFleetCarById.vehicles', vErr)
      return null
    }
    if (!v) return null
    return mapVehicleRowToCar(v as VehicleRow)
  } catch {
    return null
  }
}
