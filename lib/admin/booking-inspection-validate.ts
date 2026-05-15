import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  INSPECTION_PHOTO_SLOTS,
  PICKUP_INSPECTION_CHECKLIST_KEYS,
  RETURN_INSPECTION_CHECKLIST_KEYS,
} from '@/lib/booking/inspection'
import { isPostedRentalPayment } from '@/lib/payments/booking-payment'
import type { Database, Json } from '@/lib/supabase/database.types'

type AdminClient = SupabaseClient<Database>

function readChecklist(j: Json | null | undefined): Record<string, boolean> {
  if (!j || typeof j !== 'object' || Array.isArray(j)) return {}
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(j as Record<string, unknown>)) {
    out[k] = Boolean(v)
  }
  return out
}

export async function validatePickupInspectionForHandover(
  admin: AdminClient,
  bookingId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: booking, error: bErr } = await admin
    .from('bookings')
    .select(
      'user_id, booking_status, payment_status, pickup_checklist, pickup_fuel_level, pickup_odometer_km, customer_handover_signature_path',
    )
    .eq('id', bookingId)
    .single()

  if (bErr || !booking) return { ok: false, message: 'Booking not found.' }
  if (booking.booking_status !== 'confirmed') {
    return { ok: false, message: 'Complete pickup inspection while the booking is approved (before handover).' }
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('kyc_status')
    .eq('user_id', booking.user_id)
    .maybeSingle()

  const kycOk = (profile?.kyc_status ?? '').trim().toLowerCase() === 'approved'
  if (!kycOk) {
    return { ok: false, message: 'Customer KYC must be approved before handover.' }
  }

  if (!isPostedRentalPayment(booking.payment_status ?? '')) {
    return { ok: false, message: 'Rental payment must be received (or partial) before handover.' }
  }

  const pickup = readChecklist(booking.pickup_checklist)
  for (const key of PICKUP_INSPECTION_CHECKLIST_KEYS) {
    if (!pickup[key]) {
      return { ok: false, message: 'Complete all pickup checklist items before handover.' }
    }
  }

  if (booking.pickup_fuel_level == null || booking.pickup_fuel_level < 0 || booking.pickup_fuel_level > 100) {
    return { ok: false, message: 'Record pickup fuel level (0–100%) before handover.' }
  }

  const odo = booking.pickup_odometer_km
  if (odo == null || !Number.isFinite(Number(odo)) || Number(odo) < 1) {
    return { ok: false, message: 'Record pickup odometer (km) before handover.' }
  }

  if (!booking.customer_handover_signature_path?.trim()) {
    return { ok: false, message: 'Customer signature is required before handover.' }
  }

  const { data: photos, error: pErr } = await admin
    .from('booking_inspection_photos')
    .select('slot')
    .eq('booking_id', bookingId)
    .eq('phase', 'pickup')

  if (pErr) return { ok: false, message: 'Could not verify pickup photos. Try again.' }

  const slots = new Set((photos ?? []).map((r) => r.slot))
  for (const slot of INSPECTION_PHOTO_SLOTS) {
    if (!slots.has(slot)) {
      return { ok: false, message: `Pickup photo missing: ${slot}.` }
    }
  }

  return { ok: true }
}

export async function validateReturnInspectionForCheckpoint(
  admin: AdminClient,
  bookingId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: booking, error: bErr } = await admin
    .from('bookings')
    .select('booking_status, returned_at, return_checklist, return_fuel_level, return_odometer_km')
    .eq('id', bookingId)
    .single()

  if (bErr || !booking) return { ok: false, message: 'Booking not found.' }
  if (booking.booking_status !== 'active') {
    return { ok: false, message: 'Return inspection applies to active trips only.' }
  }
  if (booking.returned_at) {
    return { ok: true }
  }

  const ret = readChecklist(booking.return_checklist)
  for (const key of RETURN_INSPECTION_CHECKLIST_KEYS) {
    if (!ret[key]) {
      return { ok: false, message: 'Complete all return checklist items before marking returned.' }
    }
  }

  if (booking.return_fuel_level == null || booking.return_fuel_level < 0 || booking.return_fuel_level > 100) {
    return { ok: false, message: 'Record return fuel level (0–100%) before marking returned.' }
  }

  const odo = booking.return_odometer_km
  if (odo == null || !Number.isFinite(Number(odo)) || Number(odo) < 1) {
    return { ok: false, message: 'Record return odometer (km) before marking returned.' }
  }

  const { data: photos, error: pErr } = await admin
    .from('booking_inspection_photos')
    .select('slot')
    .eq('booking_id', bookingId)
    .eq('phase', 'return')

  if (pErr) return { ok: false, message: 'Could not verify return photos. Try again.' }

  const slots = new Set((photos ?? []).map((r) => r.slot))
  for (const slot of INSPECTION_PHOTO_SLOTS) {
    if (!slots.has(slot)) {
      return { ok: false, message: `Return photo missing: ${slot}.` }
    }
  }

  return { ok: true }
}
