import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server-client'
import type { Car } from '@/types/car'
import { mapFleetRowToCar, type FleetCarRow } from '@/lib/fleet/mappers'
import { mapVehicleRowToCar, type VehicleRow } from '@/lib/fleet/vehicle-mappers'
import { logFleetVehiclesError } from '@/lib/fleet/public-vehicle-catalog'

const LEGACY_CAR_COLUMNS =
  'id,brand,model,year,registration_number,fuel_type,transmission,seats,pricing_per_day,security_deposit,availability_status,featured,cover_image_path,gallery_paths,created_at' as const

/** Public catalog row (`vehicles`), with legacy `cars` fallback for admin inventory still on the old table. */
export async function getFleetCarById(id: string): Promise<Car | null> {
  try {
    const publicSupabase = createPublicServerSupabaseClient()
    const { data: v, error: vErr } = await publicSupabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (vErr) {
      logFleetVehiclesError('getFleetCarById.vehicles', vErr)
    }
    if (!vErr && v) {
      return mapVehicleRowToCar(v as VehicleRow)
    }

    const supabase = await createClient()
    const { data: c, error: cErr } = await supabase
      .from('cars')
      .select(LEGACY_CAR_COLUMNS)
      .eq('id', id)
      .maybeSingle()

    if (cErr || !c) return null
    return mapFleetRowToCar(c as FleetCarRow)
  } catch {
    return null
  }
}
