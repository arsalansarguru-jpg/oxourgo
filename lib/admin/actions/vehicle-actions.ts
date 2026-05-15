'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { requirePermissionForAdminAction } from '@/lib/auth/admin-action-auth'
import type { Database, Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminActionDbFailed, logUnknownError, SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'

export async function adminCreateVehicleAction(input: {
  name: string
  brand: string
  city?: string | null
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
  return runInstrumentedServerAction('adminCreateVehicleAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('fleet.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()

    const insert: Database['public']['Tables']['vehicles']['Insert'] = {
      name: input.name.trim(),
      brand: input.brand.trim(),
      city: input.city?.trim() ? input.city.trim() : null,
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
    if (error) return adminActionDbFailed('adminCreateVehicleAction', error)
    if (!data?.id) return { ok: false, message: SAFE_USER_MESSAGE.generic }

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
  })
}

export async function adminUpdateVehicleAction(
  id: string,
  patch: Database['public']['Tables']['vehicles']['Update'],
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminUpdateVehicleAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('fleet.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()

    const { error } = await admin.from('vehicles').update(patch).eq('id', id)
    if (error) return adminActionDbFailed('adminUpdateVehicleAction', error)

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
  })
}

export async function adminSetVehicleAvailableAction(id: string, available: boolean): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSetVehicleAvailableAction', 'admin', async () => {
    return adminUpdateVehicleAction(id, { available })
  })
}

export async function adminUploadVehicleImageAction(formData: FormData): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminUploadVehicleImageAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('fleet.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const vehicleId = String(formData.get('vehicleId') ?? '').trim()
    const file = formData.get('file')
    if (!vehicleId || !(file instanceof File) || file.size === 0) {
      return { ok: false, message: 'Vehicle and image file are required.' }
    }

    const maxBytes = 6 * 1024 * 1024
    if (file.size > maxBytes) {
      return { ok: false, message: 'Image must be 6MB or smaller.' }
    }

    const admin = createAdminClient()
    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
    const path = `${vehicleId}/catalog-${Date.now()}.${safeExt}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: upErr } = await admin.storage.from('fleet').upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })
    if (upErr) {
      logUnknownError('adminUploadVehicleImageAction:storage', upErr)
      return { ok: false, message: SAFE_USER_MESSAGE.generic }
    }

    const { error: dbErr } = await admin.from('vehicles').update({ image: path }).eq('id', vehicleId)
    if (dbErr) return adminActionDbFailed('adminUploadVehicleImageAction:db', dbErr)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'fleet.vehicle_image_upload',
      entityType: 'vehicle',
      entityId: vehicleId,
      payload: { path },
    })

    revalidatePath('/admin/fleet')
    revalidatePath(`/admin/fleet/${vehicleId}`)
    revalidatePath('/fleet')
    return { ok: true }
  })
}

export async function adminToggleVehicleFeaturedAction(id: string, featured: boolean): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminToggleVehicleFeaturedAction', 'admin', async () => {
    return adminUpdateVehicleAction(id, { featured })
  })
}

export async function adminDeleteVehicleAction(id: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminDeleteVehicleAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('fleet.delete')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin.from('vehicles').select('*').eq('id', id).maybeSingle()
    if (fetchErr || !row) return { ok: false, message: 'Vehicle not found.' }

    const { softDeleteRecord } = await import('@/lib/admin/soft-delete')
    const archived = await softDeleteRecord({
      table: 'vehicles',
      id,
      actorUserId: user.id,
      snapshot: row as Record<string, unknown>,
      entityType: 'vehicle',
    })
    if (!archived.ok) return archived

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'fleet.archived',
      entityType: 'vehicle',
      entityId: id,
    })

    revalidatePath('/admin/fleet')
    revalidatePath('/admin/backup')
    revalidatePath('/fleet')
    return { ok: true }
  })
}
