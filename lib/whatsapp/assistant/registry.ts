import 'server-only'

import { inquiryHandler } from '@/lib/whatsapp/assistant/handlers/inquiry'
import { collectingDatesStubHandler } from '@/lib/whatsapp/assistant/handlers/stub-collecting-dates'
import type {
  AssistantTurnContext,
  AssistantTurnResult,
  WhatsAppAssistantHandler,
} from '@/lib/whatsapp/assistant/types'
import type { WhatsAppFlowState } from '@/lib/whatsapp/types'

/**
 * Modular assistant registry — register new handlers for AI or rule-based flows
 * without changing webhook routing.
 */
const HANDLERS: WhatsAppAssistantHandler[] = [inquiryHandler, collectingDatesStubHandler]

const FALLBACK_HANDLER: WhatsAppAssistantHandler = {
  id: 'fallback-echo',
  flowStates: '*',
  async handle(ctx) {
    return {
      handled: true,
      replyText: `Thanks for your message. Our concierge will follow up. (State: ${ctx.conversation.flow_state})`,
    }
  },
}

function handlerMatchesState(handler: WhatsAppAssistantHandler, state: WhatsAppFlowState): boolean {
  if (handler.flowStates === '*') return true
  return handler.flowStates.includes(state)
}

export function listWhatsAppAssistantHandlers(): readonly WhatsAppAssistantHandler[] {
  return HANDLERS
}

/** Run the first matching handler for the conversation flow state. */
export async function runWhatsAppAssistantTurn(ctx: AssistantTurnContext): Promise<AssistantTurnResult> {
  const state = ctx.conversation.flow_state as WhatsAppFlowState
  const specific = HANDLERS.find((h) => handlerMatchesState(h, state) && h.flowStates !== '*')
  const handler = specific ?? FALLBACK_HANDLER
  return handler.handle(ctx)
}
