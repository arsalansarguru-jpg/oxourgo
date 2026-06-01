import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Returns true if another non-cancelled booking overlaps [pickup, return) for this car.
 * Uses `has_booking_overlap` RPC (SECURITY DEFINER). On failure, details are logged server-side only;
 * `error` is an opaque token (not end-user copy).
 */
export async function hasBookingOverlap(
  carId: string,
  pickupIso: string,
  returnIso: string,
  excludeBookingId?: string | null,
): Promise<{ overlap: boolean; error: string | null }> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('has_booking_overlap', {
      p_car_id: carId,
      p_pickup: pickupIso,
      p_return: returnIso,
      p_exclude_booking_id: excludeBookingId ?? null,
    })
    if (error) {
      if (error.message.includes('has_booking_overlap') || error.code === '42883') {
        console.error('[hasBookingOverlap] RPC missing or not deployed', error.message, error.code)
        return { overlap: false, error: 'overlap_check_unavailable' }
      }
      console.error('[hasBookingOverlap]', error.message, error.code, error.details, error.hint)
      return { overlap: false, error: 'overlap_check_failed' }
    }
    return { overlap: Boolean(data), error: null }
  } catch (e) {
    console.error('[hasBookingOverlap] exception', e)
    return { overlap: false, error: 'overlap_check_failed' }
  }
}
