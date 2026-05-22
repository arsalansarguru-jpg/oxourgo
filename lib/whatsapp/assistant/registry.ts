import 'server-only'

import { aiConciergeHandler } from '@/lib/whatsapp/assistant/handlers/ai-concierge'
import type {
  AssistantTurnContext,
  AssistantTurnResult,
  WhatsAppAssistantHandler,
} from '@/lib/whatsapp/assistant/types'
import type { WhatsAppFlowState } from '@/lib/whatsapp/types'
import { isConversationEscalated } from '@/lib/whatsapp/escalation'

/**
 * Modular assistant registry — AI concierge is the primary handler.
 * Register additional rule-based handlers before the concierge for overrides.
 */
const HANDLERS: WhatsAppAssistantHandler[] = [aiConciergeHandler]

const ESCALATED_HANDLER: WhatsAppAssistantHandler = {
  id: 'escalated-hold',
  flowStates: '*',
  async handle() {
    return {
      handled: true,
      replyText:
        'Your chat is with our operations team. We will respond shortly — thank you for waiting.',
    }
  },
}

const FALLBACK_HANDLER: WhatsAppAssistantHandler = {
  id: 'fallback-closed',
  flowStates: ['closed'],
  async handle() {
    return {
      handled: true,
      replyText: 'This conversation is closed. Message us anytime to start a new rental inquiry.',
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

  if (isConversationEscalated(ctx.conversation)) {
    return ESCALATED_HANDLER.handle(ctx)
  }

  if (state === 'closed') {
    return FALLBACK_HANDLER.handle(ctx)
  }

  const specific = HANDLERS.find((h) => handlerMatchesState(h, state) && h.flowStates !== '*')
  const handler = specific ?? aiConciergeHandler
  return handler.handle(ctx)
}
