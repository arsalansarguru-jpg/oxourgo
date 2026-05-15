/** Channel attribution on `bookings.booking_source`. */
export const BOOKING_SOURCES = ['website', 'whatsapp', 'admin_manual'] as const
export type BookingSource = (typeof BOOKING_SOURCES)[number]

/** Conversation lifecycle for ops dashboards. */
export const WHATSAPP_CONVERSATION_STATUSES = ['active', 'paused', 'closed', 'archived'] as const
export type WhatsAppConversationStatus = (typeof WHATSAPP_CONVERSATION_STATUSES)[number]

/**
 * Flow states aligned with the WhatsApp booking pipeline.
 * Future AI agents transition via `lib/whatsapp/assistant/`.
 */
export const WHATSAPP_FLOW_STATES = [
  'inquiry',
  'collecting_dates',
  'checking_availability',
  'suggesting_vehicle',
  'creating_booking',
  'awaiting_kyc',
  'payment_workflow',
  'awaiting_admin_confirmation',
  'confirmed',
  'closed',
] as const
export type WhatsAppFlowState = (typeof WHATSAPP_FLOW_STATES)[number]

export type WhatsAppConversationContext = {
  pickupAtIso?: string
  returnAtIso?: string
  pickupLocation?: string
  returnLocation?: string
  suggestedVehicleIds?: string[]
  selectedVehicleId?: string
  draftBookingId?: string
  lastCustomerMessage?: string
  notes?: string
}
