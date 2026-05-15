import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'
import { formatPaymentMethodLabel } from '@/lib/payments/methods'
import { updateWhatsAppConversationState } from '@/lib/whatsapp/conversations'

export type WhatsAppPaymentSummary = {
  bookingId: string
  paymentMethod: string
  paymentMethodLabel: string
  paymentStatus: string
  amountDue: number
  amountPaid: number
  bookingStatus: string
}

/** Read payment state from shared bookings row (pay_at_pickup + future online). */
export async function getWhatsAppBookingPaymentSummary(
  bookingId: string,
): Promise<WhatsAppPaymentSummary | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bookings')
    .select('id,payment_method,payment_status,amount_due,amount_paid,booking_status')
    .eq('id', bookingId)
    .maybeSingle()

  if (error) {
    logPostgrestError('[getWhatsAppBookingPaymentSummary]', error)
    return null
  }
  if (!data) {
    return null
  }

  return {
    bookingId: data.id,
    paymentMethod: data.payment_method,
    paymentMethodLabel: formatPaymentMethodLabel(data.payment_method),
    paymentStatus: data.payment_status,
    amountDue: data.amount_due,
    amountPaid: data.amount_paid,
    bookingStatus: data.booking_status,
  }
}

/** Advance conversation to admin confirmation after payment is recorded (ops or future webhook). */
export async function markWhatsAppPaymentAwaitingAdminConfirmation(
  conversationId: string,
  bookingId: string,
): Promise<void> {
  await updateWhatsAppConversationState({
    conversationId,
    flowState: 'awaiting_admin_confirmation',
    activeBookingId: bookingId,
  })
}
