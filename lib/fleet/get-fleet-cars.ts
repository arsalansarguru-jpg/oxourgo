import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { FleetCar } from '@/lib/fleet/types'
import { mapFleetRowToFleetCar, type FleetCarRow } from '@/lib/fleet/mappers'

type CarsTableQuery = {
  from: (table: 'cars') => {
    select: (query: string) => {
      order: (
        column: 'featured' | 'created_at',
        options?: { ascending?: boolean },
      ) => {
        order: (
          column: 'featured' | 'created_at',
          options?: { ascending?: boolean },
        ) => Promise<{ data: FleetCarRow[] | null; error: { message: string } | null }>
      }
    }
  }
}

export async function getFleetCars(): Promise<FleetCar[]> {
  try {
    const supabase = await createClient()
    const db = supabase as unknown as CarsTableQuery
    const { data, error } = await db
      .from('cars')
      .select(
        'id,brand,model,year,registration_number,fuel_type,transmission,seats,pricing_per_day,security_deposit,availability_status,featured,cover_image_path,gallery_paths,created_at',
      )
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (error || !data) return []

    return (data as FleetCarRow[]).map(mapFleetRowToFleetCar)
  } catch {
    return []
  }
}
