import 'server-only'

import { openAiJsonCompletion, isWhatsAppAiEnabled } from '@/lib/ai/openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { WHATSAPP_AI_SYSTEM_PROMPT, buildWhatsAppAiUserPrompt } from '@/lib/whatsapp/ai/prompts'
import { applyFlowEngineResult, runWhatsAppFlowEngine } from '@/lib/whatsapp/flow/engine'
import { escalateWhatsAppConversation, isConversationEscalated } from '@/lib/whatsapp/escalation'
import { notifyOpsWhatsAppEscalation } from '@/lib/whatsapp/admin-notify'
import type { AssistantTurnContext, AssistantTurnResult } from '@/lib/whatsapp/assistant/types'
import type { WhatsAppFlowState } from '@/lib/whatsapp/types'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type AiTurnJson = {
  reply: string
  escalate: boolean
  escalationReason: string | null
  extracted: {
    pickupAtIso?: string | null
    returnAtIso?: string | null
    pickupLocation?: string | null
    returnLocation?: string | null
    vehicleChoiceIndex?: number | null
    confirmBooking?: boolean | null
  }
}

const FALLBACK_REPLY =
  'Thanks for messaging Oxour Go. Share your pickup and return dates (e.g. 20 May 10:00 to 22 May 10:00) and preferred hub, and our team will assist you.'

async function loadRecentMessages(conversationId: string, limit = 8): Promise<string> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('whatsapp_conversation_messages')
    .select('direction, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logPostgrestError('[loadRecentMessages]', error)
    return ''
  }

  return (data ?? [])
    .reverse()
    .map((m) => `${m.direction}: ${m.body ?? ''}`)
    .join('\n')
}

async function markAiTurn(conversationId: string, model: string): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('whatsapp_conversations')
    .update({
      last_ai_turn_at: new Date().toISOString(),
      last_ai_model: model,
    })
    .eq('id', conversationId)
}

/** Rule-based fallback when OpenAI is disabled or fails. */
async function runRuleBasedTurn(ctx: AssistantTurnContext): Promise<AssistantTurnResult> {
  const text = ctx.inbound.text ?? ''
  const flow = await runWhatsAppFlowEngine({
    conversation: ctx.conversation,
    contact: ctx.contact,
    customerText: text,
  })
  await applyFlowEngineResult(ctx.conversation.id, flow, ctx.conversation.active_booking_id)

  let reply = FALLBACK_REPLY
  if (flow.facts.needsDates) {
    reply =
      'Please share pickup and return date/time (e.g. 20 May 10:00 to 22 May 10:00) and your preferred Oxour hub.'
  } else if (flow.facts.options) {
    reply = `Available options:\n${(flow.facts.options as string[]).join('\n')}\n\nReply with the option number to continue.`
  } else if (flow.facts.awaitingConfirmation) {
    reply = 'Reply CONFIRM to create your booking with the selected vehicle.'
  } else if (flow.facts.bookingId) {
    reply = `Your booking reference is ${flow.facts.bookingId}. Total ₹${flow.facts.totalRupees}. Our team will confirm shortly.`
  } else if (flow.facts.kycLink) {
    reply = `Please complete KYC here before pickup: ${flow.facts.kycLink}`
  } else if (flow.facts.accountRequired) {
    reply = `Please sign in or register first: ${flow.facts.signupUrl}`
  }

  return { handled: true, replyText: reply, nextFlowState: flow.nextFlowState }
}

/**
 * AI + flow engine orchestration for one inbound WhatsApp turn.
 */
export async function runWhatsAppAiOrchestrator(ctx: AssistantTurnContext): Promise<AssistantTurnResult> {
  const conv = ctx.conversation as typeof ctx.conversation & {
    escalated_at?: string | null
    ai_enabled?: boolean | null
  }

  if (isConversationEscalated(conv)) {
    return {
      handled: true,
      replyText:
        'Your conversation is with our operations team. A concierge will reply shortly — thank you for your patience.',
    }
  }

  if (conv.ai_enabled === false) {
    return runRuleBasedTurn(ctx)
  }

  const customerText = ctx.inbound.text?.trim() ?? ''
  if (!customerText) {
    return { handled: true, replyText: 'Please send a text message so we can help with your rental.' }
  }

  if (!isWhatsAppAiEnabled()) {
    return runRuleBasedTurn(ctx)
  }

  const history = await loadRecentMessages(ctx.conversation.id)
  const flowPre = await runWhatsAppFlowEngine({
    conversation: ctx.conversation,
    contact: ctx.contact,
    customerText,
  })

  const completion = await openAiJsonCompletion<AiTurnJson>({
    messages: [
      { role: 'system', content: WHATSAPP_AI_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildWhatsAppAiUserPrompt({
          flowState: ctx.conversation.flow_state as WhatsAppFlowState,
          contextJson: JSON.stringify(ctx.conversation.context ?? {}),
          flowResultJson: JSON.stringify(flowPre.facts),
          customerMessage: customerText,
          contactName: ctx.contact.full_name,
          hasLinkedAccount: Boolean(ctx.contact.user_id),
        }),
      },
      ...(history ? [{ role: 'user' as const, content: `RECENT_THREAD:\n${history}` }] : []),
    ],
  })

  if (!completion.ok) {
    await applyFlowEngineResult(ctx.conversation.id, flowPre, ctx.conversation.active_booking_id)
    return runRuleBasedTurn(ctx)
  }

  const ai = completion.data
  await markAiTurn(ctx.conversation.id, completion.model)

  if (ai.escalate) {
    const reason = ai.escalationReason?.trim() || 'Customer requested human assistance'
    await escalateWhatsAppConversation({
      conversationId: ctx.conversation.id,
      reason,
      triggeredBy: 'ai',
      customerMessage: customerText,
    })
    void notifyOpsWhatsAppEscalation({
      conversationId: ctx.conversation.id,
      contactE164: ctx.contact.e164,
      reason,
      lastMessage: customerText,
    })
    return {
      handled: true,
      replyText:
        ai.reply?.trim() ||
        'I have connected you with our operations team. A human concierge will follow up on WhatsApp shortly.',
    }
  }

  const flow = await runWhatsAppFlowEngine({
    conversation: ctx.conversation,
    contact: ctx.contact,
    customerText,
    aiExtracted: ai.extracted,
  })

  await applyFlowEngineResult(
    ctx.conversation.id,
    {
      ...flow,
      contextPatch: {
        ...flow.contextPatch,
        lastAiExtraction: ai.extracted as Record<string, unknown>,
      },
    },
    (flow.facts.bookingId as string | undefined) ?? ctx.conversation.active_booking_id,
  )

  const reply =
    ai.reply?.trim() ||
    (flow.blockingError
      ? `We could not complete that step: ${flow.blockingError}`
      : FALLBACK_REPLY)

  return {
    handled: true,
    replyText: reply.slice(0, 4096),
    nextFlowState: flow.nextFlowState,
  }
}
