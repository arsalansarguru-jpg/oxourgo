import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Car } from '@/types/car'
import { mapFleetRowToCar, type FleetCarRow } from '@/lib/fleet/mappers'

type CarByIdQuery = {
  from: (table: 'cars') => {
    select: (columns: string) => {
      eq: (
        column: 'id',
        value: string,
      ) => {
        maybeSingle: () => Promise<{ data: FleetCarRow | null; error: { message: string } | null }>
      }
    }
  }
}

export async function getFleetCarById(id: string): Promise<Car | null> {
  try {
    const supabase = await createClient()
    const db = supabase as unknown as CarByIdQuery
    const { data, error } = await db
      .from('cars')
      .select(
        'id,brand,model,year,registration_number,fuel_type,transmission,seats,pricing_per_day,security_deposit,availability_status,featured,cover_image_path,gallery_paths,created_at',
      )
      .eq('id', id)
      .maybeSingle()

    if (error || !data) return null
    return mapFleetRowToCar(data as FleetCarRow)
  } catch {
    return null
  }
}
