import 'server-only'

import type { PostgrestError } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'

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
): Promise<{ overlap: boolean; error: string | null }> {
  const admin = createAdminClient()
  let q = admin
    .from('bookings')
    .select('id')
    .eq('car_id', vehicleId)
    .lt('pickup_date', returnIso)
    .gt('return_date', pickupIso)
    .not('booking_status', 'eq', 'cancelled')
    .limit(1)

  if (excludeBookingId) {
    q = q.neq('id', excludeBookingId)
  }

  const { data, error } = await q
  if (error) return { overlap: false, error: error.message }
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
): Promise<{ overlap: boolean; error: string | null }> {
  try {
    const client = rpcClient ?? (await createClient())
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
      return { overlap: false, error: error.message }
    }

    try {
      return await overlapViaBookingsTableAdmin(vehicleId, pickupIso, returnIso, excludeBookingId)
    } catch (adminErr) {
      const detail = adminErr instanceof Error ? adminErr.message : String(adminErr)
      return {
        overlap: false,
        error: `has_vehicle_booking_overlap is missing on the database (${detail}). Apply supabase/migrations/20260513140000_bookings_vehicle_inventory.sql in the Supabase SQL editor, or set SUPABASE_SERVICE_ROLE_KEY on the server for a temporary overlap fallback.`,
      }
    }
  } catch (e) {
    return { overlap: false, error: e instanceof Error ? e.message : 'Overlap check failed.' }
  }
}
