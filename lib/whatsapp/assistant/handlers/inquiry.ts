import type { WhatsAppAssistantHandler } from '@/lib/whatsapp/assistant/types'
import { updateWhatsAppConversationState } from '@/lib/whatsapp/conversations'

/** Default inquiry handler — acknowledges and moves to date collection. */
export const inquiryHandler: WhatsAppAssistantHandler = {
  id: 'inquiry-default',
  flowStates: ['inquiry'],
  async handle(ctx) {
    await updateWhatsAppConversationState({
      conversationId: ctx.conversation.id,
      flowState: 'collecting_dates',
      contextPatch: { lastCustomerMessage: ctx.inbound.text },
    })

    return {
      handled: true,
      nextFlowState: 'collecting_dates',
      replyText:
        'Thanks for reaching Oxour Go. Please share your pickup and return dates (e.g. 20 May 10:00 to 22 May 10:00) and preferred hub.',
    }
  },
}
