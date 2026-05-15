/**
 * WhatsApp operations — shared Supabase backend with the website.
 * @see lib/whatsapp/assistant/registry.ts for future AI handler registration.
 */
export type { BookingSource, WhatsAppFlowState, WhatsAppConversationContext } from '@/lib/whatsapp/types'
export { BOOKING_SOURCES, WHATSAPP_FLOW_STATES } from '@/lib/whatsapp/types'
export { normalizeToE164 } from '@/lib/whatsapp/e164'
export { processWhatsAppInbound } from '@/lib/whatsapp/process-inbound'
export { isWhatsAppWebhookConfigured } from '@/lib/whatsapp/webhook-auth'
