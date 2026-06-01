'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { requirePermissionForAdminAction } from '@/lib/auth/admin-action-auth'
import type { Database, Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminActionDbFailed, logUnknownError, SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import { normalizeVehicleGalleryImages, type VehicleGalleryLabelId } from '@/lib/fleet/vehicle-gallery'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'

const MAX_GALLERY_IMAGES = 16
const MAX_IMAGE_BYTES = 6 * 1024 * 1024
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

function safeImageExt(filename: string): string {
  const ext = (filename.split('.').pop() ?? 'jpg').toLowerCase()
  return ALLOWED_EXT.has(ext) ? ext : 'jpg'
}

function revalidateVehiclePaths(vehicleId: string) {
  revalidatePath('/admin/fleet')
  revalidatePath(`/admin/fleet/${vehicleId}`)
  revalidatePath('/fleet')
  revalidatePath(`/car/${vehicleId}`)
}

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

    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, message: 'Image must be 6MB or smaller.' }
    }

    const admin = createAdminClient()
    const safeExt = safeImageExt(file.name)
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

    revalidateVehiclePaths(vehicleId)
    return { ok: true }
  })
}

export async function adminAppendVehicleGalleryImagesAction(formData: FormData): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminAppendVehicleGalleryImagesAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('fleet.write')
    if (!guard.ok) return guard
    const { user } = guard.session

    const vehicleId = String(formData.get('vehicleId') ?? '').trim()
    const label = String(formData.get('label') ?? 'other').trim() as VehicleGalleryLabelId
    const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)

    if (!vehicleId || files.length === 0) {
      return { ok: false, message: 'Select at least one image to upload.' }
    }

    const admin = createAdminClient()
    const { data: row, error: fetchErr } = await admin
      .from('vehicles')
      .select('gallery_images, image')
      .eq('id', vehicleId)
      .maybeSingle()
    if (fetchErr || !row) return { ok: false, message: 'Vehicle not found.' }

    const existing = normalizeVehicleGalleryImages(row.gallery_images)
    if (existing.length + files.length > MAX_GALLERY_IMAGES) {
      return { ok: false, message: `Gallery supports up to ${MAX_GALLERY_IMAGES} images.` }
    }

    const uploaded: { path: string; label: string }[] = []
    for (const file of files) {
      if (file.size > MAX_IMAGE_BYTES) {
        return { ok: false, message: 'Each image must be 6MB or smaller.' }
      }
      const safeExt = safeImageExt(file.name)
      const path = `${vehicleId}/gallery-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: upErr } = await admin.storage.from('fleet').upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      })
      if (upErr) {
        logUnknownError('adminAppendVehicleGalleryImagesAction:storage', upErr)
        return { ok: false, message: SAFE_USER_MESSAGE.generic }
      }
      uploaded.push({ path, label: label || 'other' })
    }

    const nextGallery = [...existing, ...uploaded].slice(0, MAX_GALLERY_IMAGES)
    const patch: Database['public']['Tables']['vehicles']['Update'] = {
      gallery_images: nextGallery as unknown as Json,
    }
    if (!row.image && uploaded[0]) {
      patch.image = uploaded[0].path
    }

    const { error: dbErr } = await admin.from('vehicles').update(patch).eq('id', vehicleId)
    if (dbErr) return adminActionDbFailed('adminAppendVehicleGalleryImagesAction:db', dbErr)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'fleet.vehicle_gallery_upload',
      entityType: 'vehicle',
      entityId: vehicleId,
      payload: { count: uploaded.length, label },
    })

    revalidateVehiclePaths(vehicleId)
    return { ok: true }
  })
}

export async function adminRemoveVehicleGalleryImageAction(
  vehicleId: string,
  path: string,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminRemoveVehicleGalleryImageAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('fleet.write')
    if (!guard.ok) return guard
    const { user } = guard.session

    const normalizedPath = path.trim()
    if (!vehicleId || !normalizedPath) {
      return { ok: false, message: 'Invalid gallery item.' }
    }

    const admin = createAdminClient()
    const { data: row, error: fetchErr } = await admin
      .from('vehicles')
      .select('gallery_images, image')
      .eq('id', vehicleId)
      .maybeSingle()
    if (fetchErr || !row) return { ok: false, message: 'Vehicle not found.' }

    const existing = normalizeVehicleGalleryImages(row.gallery_images)
    const nextGallery = existing.filter((g) => g.path !== normalizedPath)
    if (nextGallery.length === existing.length) {
      return { ok: false, message: 'Image not found in gallery.' }
    }

    let nextCover = row.image
    if (row.image === normalizedPath) {
      nextCover = nextGallery[0]?.path ?? null
    }

    const { error: dbErr } = await admin
      .from('vehicles')
      .update({
        gallery_images: nextGallery as unknown as Json,
        image: nextCover,
      })
      .eq('id', vehicleId)
    if (dbErr) return adminActionDbFailed('adminRemoveVehicleGalleryImageAction:db', dbErr)

    await admin.storage.from('fleet').remove([normalizedPath])

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'fleet.vehicle_gallery_remove',
      entityType: 'vehicle',
      entityId: vehicleId,
      payload: { path: normalizedPath },
    })

    revalidateVehiclePaths(vehicleId)
    return { ok: true }
  })
}

export async function adminSetVehicleCoverFromGalleryAction(
  vehicleId: string,
  path: string,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSetVehicleCoverFromGalleryAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('fleet.write')
    if (!guard.ok) return guard

    const normalizedPath = path.trim()
    if (!vehicleId || !normalizedPath) return { ok: false, message: 'Invalid selection.' }

    const admin = createAdminClient()
    const { data: row } = await admin
      .from('vehicles')
      .select('gallery_images, image')
      .eq('id', vehicleId)
      .maybeSingle()
    if (!row) return { ok: false, message: 'Vehicle not found.' }

    const gallery = normalizeVehicleGalleryImages(row.gallery_images)
    const inGallery = gallery.some((g) => g.path === normalizedPath)
    if (!inGallery) {
      return { ok: false, message: 'Image must be in the gallery.' }
    }

    const { error } = await admin.from('vehicles').update({ image: normalizedPath }).eq('id', vehicleId)
    if (error) return adminActionDbFailed('adminSetVehicleCoverFromGalleryAction', error)

    revalidateVehiclePaths(vehicleId)
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
