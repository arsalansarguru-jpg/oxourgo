import type { WhatsAppAssistantHandler } from '@/lib/whatsapp/assistant/types'
import { updateWhatsAppConversationState } from '@/lib/whatsapp/conversations'

/**
 * Placeholder until NLP/date parser or AI agent is integrated.
 * Stores raw message in context for ops review in admin.
 */
export const collectingDatesStubHandler: WhatsAppAssistantHandler = {
  id: 'collecting-dates-stub',
  flowStates: ['collecting_dates'],
  async handle(ctx) {
    await updateWhatsAppConversationState({
      conversationId: ctx.conversation.id,
      flowState: 'checking_availability',
      contextPatch: {
        lastCustomerMessage: ctx.inbound.text,
        notes: 'Dates pending ops parse — use admin console or future AI agent.',
      },
    })

    return {
      handled: true,
      nextFlowState: 'checking_availability',
      replyText:
        'Got it. Our team will confirm availability shortly. You can also book instantly on our website with the same fleet and pricing.',
    }
  },
}
