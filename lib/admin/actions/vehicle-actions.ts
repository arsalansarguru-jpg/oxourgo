'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { requireAppRole } from '@/lib/auth/server'
import type { Database, Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

export async function adminCreateVehicleAction(input: {
  name: string
  brand: string
  year: number
  registration_number: string
  fuel_type: string
  transmission: string
  seats: number
  price_per_day: number
  security_deposit: number
  featured?: boolean
  available?: boolean
}): Promise<AdminActionResult & { id?: string }> {
  const { user } = await requireAppRole('ops_admin')
  const admin = createAdminClient()

  const insert: Database['public']['Tables']['vehicles']['Insert'] = {
    name: input.name.trim(),
    brand: input.brand.trim(),
    year: input.year,
    registration_number: input.registration_number.trim(),
    fuel_type: input.fuel_type.trim().toLowerCase(),
    transmission: input.transmission.trim().toLowerCase(),
    seats: input.seats,
    price_per_day: input.price_per_day,
    security_deposit: input.security_deposit,
    featured: Boolean(input.featured),
    available: input.available !== false,
  }

  const { data, error } = await admin.from('vehicles').insert(insert).select('id').single()
  if (error || !data?.id) {
    return { ok: false, message: error?.message ?? 'Could not create vehicle.' }
  }

  await writeAdminAudit({
    actorUserId: user.id,
    action: 'fleet.vehicle_create',
    entityType: 'vehicle',
    entityId: data.id,
    payload: { registration_number: insert.registration_number },
  })

  revalidatePath('/admin/fleet')
  revalidatePath('/fleet')
  return { ok: true, id: data.id }
}

export async function adminUpdateVehicleAction(
  id: string,
  patch: Database['public']['Tables']['vehicles']['Update'],
): Promise<AdminActionResult> {
  const { user } = await requireAppRole('ops_admin')
  const admin = createAdminClient()

  const { error } = await admin.from('vehicles').update(patch).eq('id', id)
  if (error) return { ok: false, message: error.message }

  await writeAdminAudit({
    actorUserId: user.id,
    action: 'fleet.vehicle_update',
    entityType: 'vehicle',
    entityId: id,
    payload: patch as unknown as Json,
  })

  revalidatePath('/admin/fleet')
  revalidatePath(`/admin/fleet/${id}`)
  revalidatePath('/fleet')
  return { ok: true }
}

export async function adminSetVehicleAvailableAction(id: string, available: boolean): Promise<AdminActionResult> {
  return adminUpdateVehicleAction(id, { available })
}

export async function adminToggleVehicleFeaturedAction(id: string, featured: boolean): Promise<AdminActionResult> {
  return adminUpdateVehicleAction(id, { featured })
}

export async function adminDeleteVehicleAction(id: string): Promise<AdminActionResult> {
  const { user } = await requireAppRole('ops_admin')
  const admin = createAdminClient()

  const { error } = await admin.from('vehicles').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }

  await writeAdminAudit({
    actorUserId: user.id,
    action: 'fleet.vehicle_delete',
    entityType: 'vehicle',
    entityId: id,
  })

  revalidatePath('/admin/fleet')
  revalidatePath('/fleet')
  return { ok: true }
}
