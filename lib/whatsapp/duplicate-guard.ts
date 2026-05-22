import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type DuplicateBookingGuardInput = {
  conversationId: string
  userId: string
  vehicleId: string
  pickupAtIso: string
  returnAtIso: string
  excludeBookingId?: string | null
}

export type DuplicateBookingGuardResult =
  | { allowed: true }
  | { allowed: false; existingBookingId: string; reason: string }

/**
 * Prevent duplicate active bookings for the same WhatsApp thread + vehicle + trip window.
 */
export async function checkWhatsAppDuplicateBooking(
  input: DuplicateBookingGuardInput,
): Promise<DuplicateBookingGuardResult> {
  const admin = createAdminClient()
  const pickup = input.pickupAtIso.slice(0, 19)
  const ret = input.returnAtIso.slice(0, 19)

  let q = admin
    .from('bookings')
    .select('id, booking_status')
    .eq('whatsapp_conversation_id', input.conversationId)
    .eq('user_id', input.userId)
    .eq('vehicle_id', input.vehicleId)
    .eq('pickup_date', pickup)
    .eq('return_date', ret)
    .is('deleted_at', null)
    .neq('booking_status', 'cancelled')
    .limit(1)

  if (input.excludeBookingId) {
    q = q.neq('id', input.excludeBookingId)
  }

  const { data, error } = await q.maybeSingle()

  if (error) {
    logPostgrestError('[checkWhatsAppDuplicateBooking]', error)
    return { allowed: true }
  }

  if (data?.id) {
    return {
      allowed: false,
      existingBookingId: data.id,
      reason: 'An active booking already exists for this trip on this thread.',
    }
  }

  return { allowed: true }
}
