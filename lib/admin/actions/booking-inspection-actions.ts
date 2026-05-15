'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { requireAppRole } from '@/lib/auth/server'
import {
  conditionNotesToJson,
  type ConditionNotesShape,
  INSPECTION_PHASES,
  INSPECTION_PHOTO_SLOTS,
  type InspectionPhase,
  type InspectionPhotoSlot,
} from '@/lib/booking/inspection'
import { adminActionDbFailed, logUnknownError, SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'
import type { Database, Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'booking_inspection'
const MAX_BYTES = 6 * 1024 * 1024
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const

function nowIso() {
  return new Date().toISOString()
}

function asChecklistRecord(j: Json | null | undefined): Record<string, boolean> {
  if (!j || typeof j !== 'object' || Array.isArray(j)) return {}
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(j as Record<string, Json>)) {
    out[k] = Boolean(v)
  }
  return out
}

async function insertInspectionEvent(
  admin: ReturnType<typeof createAdminClient>,
  input: { bookingId: string; eventType: string; payload?: Json; actorUserId: string },
) {
  const { error } = await admin.from('booking_inspection_events').insert({
    booking_id: input.bookingId,
    event_type: input.eventType,
    payload: input.payload ?? {},
    actor_user_id: input.actorUserId,
  })
  if (error) {
    logUnknownError('insertInspectionEvent', error)
  }
}

function parsePhase(raw: string): InspectionPhase | null {
  const p = raw.trim().toLowerCase()
  return (INSPECTION_PHASES as readonly string[]).includes(p) ? (p as InspectionPhase) : null
}

function parseSlot(raw: string): InspectionPhotoSlot | 'other' | null {
  const s = raw.trim().toLowerCase()
  if (s === 'other') return 'other'
  return (INSPECTION_PHOTO_SLOTS as readonly string[]).includes(s) ? (s as InspectionPhotoSlot) : null
}

export async function adminSavePickupInspectionAction(input: {
  bookingId: string
  pickupFuelLevel: number | null
  pickupOdometerKm: number | null
  notes: ConditionNotesShape
  checklistPatch?: Record<string, boolean> | null
  markCompleted?: boolean
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSavePickupInspectionAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin
      .from('bookings')
      .select('pickup_checklist, booking_status')
      .eq('id', input.bookingId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
    if (row.booking_status !== 'pending_payment' && row.booking_status !== 'confirmed') {
      return { ok: false, message: 'Pickup inspection can only be edited before the trip is active.' }
    }

    const fuel = input.pickupFuelLevel
    if (fuel != null && (fuel < 0 || fuel > 100 || !Number.isFinite(fuel))) {
      return { ok: false, message: 'Fuel level must be between 0 and 100.' }
    }

    const odo = input.pickupOdometerKm
    if (odo != null && (!Number.isFinite(odo) || odo < 0)) {
      return { ok: false, message: 'Odometer must be a non-negative number.' }
    }

    const checklist =
      input.checklistPatch != null
        ? { ...asChecklistRecord(row.pickup_checklist), ...input.checklistPatch }
        : undefined

    const ts = nowIso()
    const patch: Database['public']['Tables']['bookings']['Update'] = {
      updated_at: ts,
      pickup_fuel_level: fuel == null ? null : Math.round(fuel),
      pickup_odometer_km: odo == null ? null : Math.round(odo),
      pickup_condition_notes: conditionNotesToJson(input.notes),
    }
    if (checklist) patch.pickup_checklist = checklist as Json
    if (input.markCompleted) patch.pickup_inspection_completed_at = ts

    const { error } = await admin.from('bookings').update(patch).eq('id', input.bookingId)
    if (error) return adminActionDbFailed('adminSavePickupInspectionAction', error)

    await insertInspectionEvent(admin, {
      bookingId: input.bookingId,
      eventType: 'pickup_inspection_saved',
      payload: { markCompleted: Boolean(input.markCompleted) },
      actorUserId: user.id,
    })

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.pickup_inspection',
      entityType: 'booking',
      entityId: input.bookingId,
    })

    revalidatePath(`/admin/bookings/${input.bookingId}`)
    revalidatePath('/dashboard/bookings')
    return { ok: true }
  })
}

export async function adminSaveReturnInspectionAction(input: {
  bookingId: string
  returnFuelLevel: number | null
  returnOdometerKm: number | null
  notes: ConditionNotesShape
  checklistPatch?: Record<string, boolean> | null
  markCompleted?: boolean
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSaveReturnInspectionAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin
      .from('bookings')
      .select('return_checklist, booking_status, returned_at')
      .eq('id', input.bookingId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
    if (row.booking_status !== 'active') {
      return { ok: false, message: 'Return inspection is only available during an active trip.' }
    }
    if (row.returned_at) {
      return { ok: false, message: 'Return checkpoint is already recorded.' }
    }

    const fuel = input.returnFuelLevel
    if (fuel != null && (fuel < 0 || fuel > 100 || !Number.isFinite(fuel))) {
      return { ok: false, message: 'Fuel level must be between 0 and 100.' }
    }

    const odo = input.returnOdometerKm
    if (odo != null && (!Number.isFinite(odo) || odo < 0)) {
      return { ok: false, message: 'Odometer must be a non-negative number.' }
    }

    const checklist =
      input.checklistPatch != null
        ? { ...asChecklistRecord(row.return_checklist), ...input.checklistPatch }
        : undefined

    const ts = nowIso()
    const patch: Database['public']['Tables']['bookings']['Update'] = {
      updated_at: ts,
      return_fuel_level: fuel == null ? null : Math.round(fuel),
      return_odometer_km: odo == null ? null : Math.round(odo),
      return_condition_notes: conditionNotesToJson(input.notes),
    }
    if (checklist) patch.return_checklist = checklist as Json
    if (input.markCompleted) patch.return_inspection_completed_at = ts

    const { error } = await admin.from('bookings').update(patch).eq('id', input.bookingId)
    if (error) return adminActionDbFailed('adminSaveReturnInspectionAction', error)

    await insertInspectionEvent(admin, {
      bookingId: input.bookingId,
      eventType: 'return_inspection_saved',
      payload: { markCompleted: Boolean(input.markCompleted) },
      actorUserId: user.id,
    })

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.return_inspection',
      entityType: 'booking',
      entityId: input.bookingId,
    })

    revalidatePath(`/admin/bookings/${input.bookingId}`)
    revalidatePath('/dashboard/bookings')
    return { ok: true }
  })
}

export async function adminUploadBookingInspectionPhotoAction(formData: FormData): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminUploadBookingInspectionPhotoAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const bookingId = String(formData.get('bookingId') ?? '').trim()
    const phaseRaw = String(formData.get('phase') ?? '').trim()
    const slotRaw = String(formData.get('slot') ?? '').trim()
    const file = formData.get('file')

    const phase = parsePhase(phaseRaw)
    const slot = parseSlot(slotRaw)
    if (!bookingId || !phase || !slot) {
      return { ok: false, message: 'Booking, phase, and photo slot are required.' }
    }
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: 'Image file is required.' }
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, message: 'Image must be 6MB or smaller.' }
    }

    const admin = createAdminClient()
    const { data: booking, error: bErr } = await admin.from('bookings').select('booking_status').eq('id', bookingId).single()
    if (bErr || !booking) return { ok: false, message: 'Booking not found.' }
    if (phase === 'pickup' && booking.booking_status !== 'pending_payment' && booking.booking_status !== 'confirmed') {
      return { ok: false, message: 'Pickup photos cannot be changed after handover.' }
    }
    if (phase === 'return' && booking.booking_status !== 'active') {
      return { ok: false, message: 'Return photos are only for active trips.' }
    }

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
    const safeExt = (ALLOWED_EXT as readonly string[]).includes(ext) ? ext : 'jpg'
    const path = `bookings/${bookingId}/${phase}/${slot}-${Date.now()}.${safeExt}`

    const { data: existing } = await admin
      .from('booking_inspection_photos')
      .select('storage_path')
      .eq('booking_id', bookingId)
      .eq('phase', phase)
      .eq('slot', slot)
      .maybeSingle()

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })
    if (upErr) {
      logUnknownError('adminUploadBookingInspectionPhotoAction:storage', upErr)
      return { ok: false, message: SAFE_USER_MESSAGE.generic }
    }

    const { error: dbErr } = await admin.from('booking_inspection_photos').upsert(
      {
        booking_id: bookingId,
        phase,
        slot,
        storage_path: path,
        created_by: user.id,
        created_at: nowIso(),
      },
      { onConflict: 'booking_id,phase,slot' },
    )

    if (dbErr) {
      await admin.storage.from(BUCKET).remove([path]).catch(() => {})
      return adminActionDbFailed('adminUploadBookingInspectionPhotoAction:db', dbErr)
    }

    if (existing?.storage_path && existing.storage_path !== path) {
      await admin.storage.from(BUCKET).remove([existing.storage_path]).catch(() => {})
    }

    await insertInspectionEvent(admin, {
      bookingId,
      eventType: 'photo_uploaded',
      payload: { phase, slot, path },
      actorUserId: user.id,
    })

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.inspection_photo',
      entityType: 'booking',
      entityId: bookingId,
      payload: { phase, slot },
    })

    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath('/dashboard/bookings')
    return { ok: true }
  })
}

export async function adminUploadHandoverSignatureAction(formData: FormData): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminUploadHandoverSignatureAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const bookingId = String(formData.get('bookingId') ?? '').trim()
    const file = formData.get('file')
    if (!bookingId || !(file instanceof File) || file.size === 0) {
      return { ok: false, message: 'Booking and signature image are required.' }
    }
    if (file.size > 2 * 1024 * 1024) {
      return { ok: false, message: 'Signature file must be 2MB or smaller.' }
    }

    const admin = createAdminClient()
    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select('booking_status, customer_handover_signature_path')
      .eq('id', bookingId)
      .single()

    if (bErr || !booking) return { ok: false, message: 'Booking not found.' }
    if (booking.booking_status !== 'pending_payment' && booking.booking_status !== 'confirmed') {
      return { ok: false, message: 'Signature can only be set before handover.' }
    }

    const path = `bookings/${bookingId}/pickup/signature-${Date.now()}.png`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buffer, {
      contentType: 'image/png',
      upsert: false,
    })
    if (upErr) {
      logUnknownError('adminUploadHandoverSignatureAction:storage', upErr)
      return { ok: false, message: SAFE_USER_MESSAGE.generic }
    }

    const ts = nowIso()
    const { error: dbErr } = await admin
      .from('bookings')
      .update({
        customer_handover_signature_path: path,
        customer_handover_signed_at: ts,
        updated_at: ts,
      })
      .eq('id', bookingId)

    if (dbErr) {
      await admin.storage.from(BUCKET).remove([path]).catch(() => {})
      return adminActionDbFailed('adminUploadHandoverSignatureAction:db', dbErr)
    }

    if (booking.customer_handover_signature_path && booking.customer_handover_signature_path !== path) {
      await admin.storage.from(BUCKET).remove([booking.customer_handover_signature_path]).catch(() => {})
    }

    await insertInspectionEvent(admin, {
      bookingId,
      eventType: 'handover_signature_saved',
      payload: {},
      actorUserId: user.id,
    })

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.handover_signature',
      entityType: 'booking',
      entityId: bookingId,
    })

    revalidatePath(`/admin/bookings/${bookingId}`)
    return { ok: true }
  })
}

export async function adminApplyBookingPenaltiesAction(input: {
  bookingId: string
  penaltyDamageRupees: number
  penaltyLateRupees: number
  penaltyExtraKmRupees: number
  depositPenaltyTotalRupees: number
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminApplyBookingPenaltiesAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const nums = [
      input.penaltyDamageRupees,
      input.penaltyLateRupees,
      input.penaltyExtraKmRupees,
      input.depositPenaltyTotalRupees,
    ]
    for (const n of nums) {
      if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) {
        return { ok: false, message: 'Invalid penalty amounts.' }
      }
    }

    const { data: row, error: fetchErr } = await admin.from('bookings').select('booking_status').eq('id', input.bookingId).single()
    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
    if (row.booking_status === 'cancelled') {
      return { ok: false, message: 'Penalties cannot be applied to a cancelled booking.' }
    }

    const ts = nowIso()
    const { error } = await admin
      .from('bookings')
      .update({
        penalty_damage_rupees: Math.round(input.penaltyDamageRupees),
        penalty_late_rupees: Math.round(input.penaltyLateRupees),
        penalty_extra_km_rupees: Math.round(input.penaltyExtraKmRupees),
        deposit_penalty_total_rupees: Math.round(input.depositPenaltyTotalRupees),
        updated_at: ts,
      })
      .eq('id', input.bookingId)

    if (error) return adminActionDbFailed('adminApplyBookingPenaltiesAction', error)

    await insertInspectionEvent(admin, {
      bookingId: input.bookingId,
      eventType: 'penalty_updated',
      payload: {
        penalty_damage_rupees: Math.round(input.penaltyDamageRupees),
        penalty_late_rupees: Math.round(input.penaltyLateRupees),
        penalty_extra_km_rupees: Math.round(input.penaltyExtraKmRupees),
        deposit_penalty_total_rupees: Math.round(input.depositPenaltyTotalRupees),
      },
      actorUserId: user.id,
    })

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.penalties',
      entityType: 'booking',
      entityId: input.bookingId,
    })

    revalidatePath(`/admin/bookings/${input.bookingId}`)
    revalidatePath('/dashboard/bookings')
    return { ok: true }
  })
}
