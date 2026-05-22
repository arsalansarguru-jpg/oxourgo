/**
 * WhatsApp operations — Meta Cloud API + OpenAI concierge + shared Supabase backend.
 * @see docs/WHATSAPP_AI.md
 */
export type { BookingSource, WhatsAppFlowState, WhatsAppConversationContext } from '@/lib/whatsapp/types'
export { BOOKING_SOURCES, WHATSAPP_FLOW_STATES } from '@/lib/whatsapp/types'
export { normalizeToE164 } from '@/lib/whatsapp/e164'
export { processWhatsAppInbound } from '@/lib/whatsapp/process-inbound'
export { isWhatsAppWebhookConfigured } from '@/lib/whatsapp/webhook-auth'
export { sendWhatsAppText, sendWhatsAppTextWithRetry } from '@/lib/whatsapp/send'
export { deliverWhatsAppReply } from '@/lib/whatsapp/outbound'
export { isWhatsAppAiEnabled } from '@/lib/ai/openai'
