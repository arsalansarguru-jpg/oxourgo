import type { WhatsAppConversationRow } from '@/lib/whatsapp/conversations'
import type { CustomerContactRow } from '@/lib/whatsapp/contacts'
import type { WhatsAppFlowState } from '@/lib/whatsapp/types'

/** Inbound event from WhatsApp Cloud API (subset — extend when provider is wired). */
export type WhatsAppInboundEvent = {
  externalWaId: string
  fromE164: string
  messageId: string
  text?: string
  timestamp?: string
}

export type AssistantTurnContext = {
  conversation: WhatsAppConversationRow
  contact: CustomerContactRow
  inbound: WhatsAppInboundEvent
}

export type AssistantTurnResult = {
  /** Next flow state after handling (optional — handler may update DB itself). */
  nextFlowState?: WhatsAppFlowState
  /** Outbound text for human or template send (not sent automatically until provider wired). */
  replyText?: string
  /** When true, stop processing further handlers. */
  handled: boolean
}

export type WhatsAppAssistantHandler = {
  id: string
  /** Flow states this handler accepts; empty = fallback. */
  flowStates: WhatsAppFlowState[] | '*'
  handle: (ctx: AssistantTurnContext) => Promise<AssistantTurnResult>
}
