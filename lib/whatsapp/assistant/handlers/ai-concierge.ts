import type { WhatsAppAssistantHandler } from '@/lib/whatsapp/assistant/types'
import { runWhatsAppAiOrchestrator } from '@/lib/whatsapp/ai/orchestrator'

/**
 * Primary WhatsApp handler — GPT + deterministic flow engine for all active pipeline states.
 */
export const aiConciergeHandler: WhatsAppAssistantHandler = {
  id: 'ai-concierge',
  flowStates: [
    'inquiry',
    'collecting_dates',
    'checking_availability',
    'suggesting_vehicle',
    'creating_booking',
    'awaiting_kyc',
    'payment_workflow',
    'awaiting_admin_confirmation',
    'confirmed',
  ],
  async handle(ctx) {
    return runWhatsAppAiOrchestrator(ctx)
  },
}
