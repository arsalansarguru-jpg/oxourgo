'use server'

import { revalidatePath } from 'next/cache'

import { writeAdminAudit } from '@/lib/admin/audit'
import { requireAppRole } from '@/lib/auth/server'
import type { AdminActionResult } from '@/lib/admin/actions/types'
import type { Database, Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminActionDbFailed, logUnknownError, SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'

export async function adminCreateCarAction(input: {
  brand: string
  model: string
  year: number
  registration_number: string
  fuel_type: string
  transmission: string
  seats: number
  pricing_per_day: number
  security_deposit: number
  availability_status?: string
  featured?: boolean
}): Promise<AdminActionResult & { id?: string }> {
  const { user } = await requireAppRole('ops_admin')
  const admin = createAdminClient()

  const insert: Database['public']['Tables']['cars']['Insert'] = {
    brand: input.brand.trim(),
    model: input.model.trim(),
    year: input.year,
    registration_number: input.registration_number.trim(),
    fuel_type: input.fuel_type.trim().toLowerCase(),
    transmission: input.transmission.trim().toLowerCase(),
    seats: input.seats,
    pricing_per_day: input.pricing_per_day,
    security_deposit: input.security_deposit,
    availability_status: input.availability_status?.trim() || 'available',
    featured: Boolean(input.featured),
  }

  const { data, error } = await admin.from('cars').insert(insert).select('id').single()
  if (error) return adminActionDbFailed('adminCreateCarAction', error)
  if (!data?.id) return { ok: false, message: SAFE_USER_MESSAGE.generic }

  await writeAdminAudit({
    actorUserId: user.id,
    action: 'fleet.car_create',
    entityType: 'car',
    entityId: data.id,
    payload: { registration_number: insert.registration_number },
  })

  revalidatePath('/admin/fleet')
  revalidatePath('/fleet')
  return { ok: true, id: data.id }
}

export async function adminUpdateCarAction(
  id: string,
  patch: Database['public']['Tables']['cars']['Update'],
): Promise<AdminActionResult> {
  const { user } = await requireAppRole('ops_admin')
  const admin = createAdminClient()

  const { error } = await admin.from('cars').update(patch).eq('id', id)

  if (error) return adminActionDbFailed('adminUpdateCarAction', error)

  await writeAdminAudit({
    actorUserId: user.id,
    action: 'fleet.car_update',
    entityType: 'car',
    entityId: id,
    payload: patch as Json,
  })

  revalidatePath('/admin/fleet')
  revalidatePath(`/admin/fleet/${id}`)
  revalidatePath('/fleet')
  revalidatePath(`/car/${id}`)
  return { ok: true }
}

export async function adminDeleteCarAction(id: string): Promise<AdminActionResult> {
  const { user } = await requireAppRole('ops_admin')
  const admin = createAdminClient()

  const { error } = await admin.from('cars').delete().eq('id', id)
  if (error) return adminActionDbFailed('adminDeleteCarAction', error)

  await writeAdminAudit({
    actorUserId: user.id,
    action: 'fleet.car_delete',
    entityType: 'car',
    entityId: id,
  })

  revalidatePath('/admin/fleet')
  revalidatePath('/fleet')
  return { ok: true }
}

export async function adminToggleFeaturedAction(id: string, featured: boolean): Promise<AdminActionResult> {
  return adminUpdateCarAction(id, { featured })
}

export async function adminSetCarAvailabilityAction(
  id: string,
  availability_status: string,
): Promise<AdminActionResult> {
  const v = availability_status.trim().toLowerCase()
  if (!['available', 'unavailable', 'maintenance'].includes(v)) {
    return { ok: false, message: 'Invalid availability status.' }
  }
  return adminUpdateCarAction(id, { availability_status: v })
}

export async function adminUploadCarCoverAction(formData: FormData): Promise<AdminActionResult> {
  const { user } = await requireAppRole('ops_admin')
  const carId = String(formData.get('carId') ?? '').trim()
  const file = formData.get('file')
  if (!carId || !(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Car and image file are required.' }
  }

  const maxBytes = 6 * 1024 * 1024
  if (file.size > maxBytes) {
    return { ok: false, message: 'Image must be 6MB or smaller.' }
  }

  const admin = createAdminClient()
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
  const path = `${carId}/cover-${Date.now()}.${safeExt}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await admin.storage.from('fleet').upload(path, buffer, {
    contentType: file.type || 'image/jpeg',
    upsert: true,
  })
  if (upErr) {
    logUnknownError('adminUploadCarCoverAction:storage', upErr)
    return { ok: false, message: SAFE_USER_MESSAGE.generic }
  }

  const { error: dbErr } = await admin.from('cars').update({ cover_image_path: path }).eq('id', carId)
  if (dbErr) return adminActionDbFailed('adminUploadCarCoverAction:db', dbErr)

  await writeAdminAudit({
    actorUserId: user.id,
    action: 'fleet.cover_upload',
    entityType: 'car',
    entityId: carId,
    payload: { path },
  })

  revalidatePath('/admin/fleet')
  revalidatePath(`/admin/fleet/${carId}`)
  revalidatePath('/fleet')
  revalidatePath(`/car/${carId}`)
  return { ok: true }
}

export async function adminAppendGalleryImageAction(formData: FormData): Promise<AdminActionResult> {
  const { user } = await requireAppRole('ops_admin')
  const carId = String(formData.get('carId') ?? '').trim()
  const file = formData.get('file')
  if (!carId || !(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Car and image file are required.' }
  }

  const admin = createAdminClient()
  const { data: car, error: carErr } = await admin.from('cars').select('gallery_paths').eq('id', carId).single()
  if (carErr || !car) return { ok: false, message: 'Vehicle not found.' }

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
  const path = `${carId}/gallery-${Date.now()}.${safeExt}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: upErr } = await admin.storage.from('fleet').upload(path, buffer, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })
  if (upErr) {
    logUnknownError('adminAppendGalleryImageAction:storage', upErr)
    return { ok: false, message: SAFE_USER_MESSAGE.generic }
  }

  const existing = (car.gallery_paths as string[] | null) ?? []
  const next = [...existing, path].slice(0, 12)

  const { error: dbErr } = await admin.from('cars').update({ gallery_paths: next }).eq('id', carId)
  if (dbErr) return adminActionDbFailed('adminAppendGalleryImageAction:db', dbErr)

  await writeAdminAudit({
    actorUserId: user.id,
    action: 'fleet.gallery_append',
    entityType: 'car',
    entityId: carId,
    payload: { path },
  })

  revalidatePath('/admin/fleet')
  revalidatePath(`/admin/fleet/${carId}`)
  revalidatePath('/fleet')
  revalidatePath(`/car/${carId}`)
  return { ok: true }
}
