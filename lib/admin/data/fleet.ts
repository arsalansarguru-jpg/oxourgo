import 'server-only'

import type { Database } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminVehicleRow = Database['public']['Tables']['vehicles']['Row']

export async function adminListVehicles(): Promise<AdminVehicleRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('vehicles').select('*').order('created_at', { ascending: false })
  if (error || !data) return []
  return data as AdminVehicleRow[]
}

export async function adminGetVehicle(id: string): Promise<AdminVehicleRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('vehicles').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as AdminVehicleRow
}
