import 'server-only'

import { createClient } from '@/lib/supabase/server'

/**
 * True when another non-cancelled booking overlaps [pickup, return) for this catalog vehicle.
 * Uses `has_vehicle_booking_overlap` RPC (SECURITY DEFINER).
 */
export async function hasVehicleBookingOverlap(
  vehicleId: string,
  pickupIso: string,
  returnIso: string,
  excludeBookingId?: string | null,
): Promise<{ overlap: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('has_vehicle_booking_overlap', {
      p_vehicle_id: vehicleId,
      p_pickup: pickupIso,
      p_return: returnIso,
      p_exclude_booking_id: excludeBookingId ?? null,
    })
    if (error) {
      if (error.message.includes('has_vehicle_booking_overlap') || error.code === '42883') {
        return {
          overlap: false,
          error:
            'Database function has_vehicle_booking_overlap is missing. Apply supabase/migrations/20260513140000_bookings_vehicle_inventory.sql.',
        }
      }
      return { overlap: false, error: error.message }
    }
    return { overlap: Boolean(data), error: null }
  } catch (e) {
    return { overlap: false, error: e instanceof Error ? e.message : 'Overlap check failed.' }
  }
}
