import 'server-only'

import type { PostgrestError } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'

/** Opaque codes only — never ship Postgrest messages to clients. */
export type VehicleOverlapError = 'overlap_rpc_missing' | 'overlap_db_error' | 'overlap_unknown' | null

function isVehicleOverlapRpcMissing(error: PostgrestError): boolean {
  return error.code === '42883' || error.message.includes('has_vehicle_booking_overlap')
}

/**
 * Same overlap semantics as `public.has_vehicle_booking_overlap` (migration SQL), using the
 * service role so it works when the RPC has not been applied yet (server-only).
 */
async function overlapViaBookingsTableAdmin(
  vehicleId: string,
  pickupIso: string,
  returnIso: string,
  excludeBookingId?: string | null,
): Promise<{ overlap: boolean; error: VehicleOverlapError }> {
  const admin = createAdminClient()
  let q = admin
    .from('bookings')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .lt('pickup_date', returnIso)
    .gt('return_date', pickupIso)
    .in('booking_status', ['pending_payment', 'confirmed', 'active'])
    .limit(1)

  if (excludeBookingId) {
    q = q.neq('id', excludeBookingId)
  }

  const { data, error } = await q
  if (error) {
    console.error('[hasVehicleBookingOverlap:admin]', error.message, error.code)
    return { overlap: false, error: 'overlap_db_error' }
  }
  return { overlap: (data?.length ?? 0) > 0, error: null }
}

/**
 * True when another non-cancelled booking overlaps [pickup, return) for this catalog vehicle.
 * Prefers `has_vehicle_booking_overlap` RPC; if it is missing (42883), falls back to a
 * service-role `bookings` query when `SUPABASE_SERVICE_ROLE_KEY` is set (e.g. on Vercel).
 */
export async function hasVehicleBookingOverlap(
  vehicleId: string,
  pickupIso: string,
  returnIso: string,
  excludeBookingId?: string | null,
  rpcClient?: SupabaseClient<Database>,
): Promise<{ overlap: boolean; error: VehicleOverlapError }> {
  try {
    const client = rpcClient ?? createAdminClient()
    const { data, error } = await client.rpc('has_vehicle_booking_overlap', {
      p_vehicle_id: vehicleId,
      p_pickup: pickupIso,
      p_return: returnIso,
      p_exclude_booking_id: excludeBookingId ?? null,
    })

    if (!error) {
      return { overlap: Boolean(data), error: null }
    }

    if (!isVehicleOverlapRpcMissing(error)) {
      console.error('[hasVehicleBookingOverlap:rpc]', error.message, error.code)
      return { overlap: false, error: 'overlap_db_error' }
    }

    try {
      return await overlapViaBookingsTableAdmin(vehicleId, pickupIso, returnIso, excludeBookingId)
    } catch (adminErr) {
      console.error('[hasVehicleBookingOverlap:rpc_missing_fallback]', adminErr)
      return { overlap: false, error: 'overlap_rpc_missing' }
    }
  } catch (e) {
    console.error('[hasVehicleBookingOverlap]', e)
    return { overlap: false, error: 'overlap_unknown' }
  }
}
