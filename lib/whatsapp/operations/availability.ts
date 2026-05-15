import 'server-only'

import { validateTripWindow } from '@/lib/booking/dates'
import { hasVehicleBookingOverlap } from '@/lib/booking/vehicle-overlap'
import { isVehicleAvailableForBooking, type VehicleRow } from '@/lib/fleet/vehicle-mappers'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type WhatsAppAvailabilityResult =
  | { ok: true; available: boolean; reason?: string }
  | { ok: false; code: 'validation' | 'database'; message: string }

/** Database-driven availability — same overlap engine as website `/api/bookings/availability`. */
export async function checkWhatsAppVehicleAvailability(input: {
  vehicleId: string
  pickupAtIso: string
  returnAtIso: string
}): Promise<WhatsAppAvailabilityResult> {
  const dates = validateTripWindow(input.pickupAtIso, input.returnAtIso)
  if (!dates.ok) {
    return { ok: true, available: false, reason: dates.message }
  }

  const admin = createAdminClient()
  const { data: vehicle, error: vErr } = await admin
    .from('vehicles')
    .select('id,available')
    .eq('id', input.vehicleId)
    .maybeSingle()

  if (vErr) {
    logPostgrestError('[checkWhatsAppVehicleAvailability] vehicle', vErr)
    return { ok: false, code: 'database', message: 'Vehicle lookup failed.' }
  }
  if (!vehicle) {
    return { ok: false, code: 'validation', message: 'Vehicle not found.' }
  }
  if (!isVehicleAvailableForBooking(vehicle as VehicleRow)) {
    return { ok: true, available: false, reason: 'Vehicle is marked unavailable.' }
  }

  const { overlap, error: overlapErr } = await hasVehicleBookingOverlap(
    input.vehicleId,
    input.pickupAtIso,
    input.returnAtIso,
    null,
    admin,
  )

  if (overlapErr) {
    return { ok: false, code: 'database', message: 'Availability check failed.' }
  }

  return {
    ok: true,
    available: !overlap,
    reason: overlap ? 'Selected window overlaps an existing reservation.' : undefined,
  }
}
