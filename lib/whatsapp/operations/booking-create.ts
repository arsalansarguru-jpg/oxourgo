import 'server-only'

import { insertBookingCore } from '@/lib/booking/create-booking-core'
import { createAdminClient } from '@/lib/supabase/admin'
import { onBookingCreated } from '@/lib/notifications/events'
import { updateWhatsAppConversationState } from '@/lib/whatsapp/conversations'
import type { CustomerContactRow } from '@/lib/whatsapp/contacts'

export type CreateWhatsAppBookingInput = {
  conversationId: string
  contact: CustomerContactRow
  vehicleId: string
  pickupAtIso: string
  returnAtIso: string
  pickupLocation: string
  returnLocation: string
  paymentMethod?: string
  /** Skip KYC only when ops explicitly accepts risk (e.g. pending KYC workflow). */
  requireKyc?: boolean
}

export type CreateWhatsAppBookingResult =
  | { ok: true; bookingId: string; totalRupees: number }
  | { ok: false; code: string; message: string }

/**
 * Creates a booking in the shared `bookings` table with `booking_source = whatsapp`.
 * Requires `contact.user_id` — link account in admin before booking if missing.
 */
export async function createWhatsAppBooking(
  input: CreateWhatsAppBookingInput,
): Promise<CreateWhatsAppBookingResult> {
  if (!input.contact.user_id) {
    return {
      ok: false,
      code: 'account_required',
      message: 'Link this WhatsApp contact to a customer account before creating a booking.',
    }
  }

  const admin = createAdminClient()

  const result = await insertBookingCore(admin, {
    vehicleId: input.vehicleId,
    userId: input.contact.user_id,
    pickupAtIso: input.pickupAtIso,
    returnAtIso: input.returnAtIso,
    pickupLocation: input.pickupLocation,
    returnLocation: input.returnLocation,
    paymentMethod: input.paymentMethod ?? 'pay_at_pickup',
    bookingSource: 'whatsapp',
    customerContactId: input.contact.id,
    whatsappConversationId: input.conversationId,
    requireKyc: input.requireKyc,
  })

  if (!result.ok) {
    return { ok: false, code: result.code, message: result.message }
  }

  await updateWhatsAppConversationState({
    conversationId: input.conversationId,
    flowState: 'payment_workflow',
    activeBookingId: result.bookingId,
    contextPatch: {
      draftBookingId: result.bookingId,
      selectedVehicleId: input.vehicleId,
      pickupAtIso: input.pickupAtIso,
      returnAtIso: input.returnAtIso,
      pickupLocation: input.pickupLocation,
      returnLocation: input.returnLocation,
    },
  })

  void onBookingCreated(result.bookingId)

  return { ok: true, bookingId: result.bookingId, totalRupees: result.totalRupees }
}
