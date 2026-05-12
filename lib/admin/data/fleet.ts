import 'server-only'

import type { CarRow } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

export async function adminListCars(): Promise<CarRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('cars').select('*').order('created_at', { ascending: false })
  if (error || !data) return []
  return data as CarRow[]
}

export async function adminGetCar(id: string): Promise<CarRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('cars').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as CarRow
}
