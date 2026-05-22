import 'server-only'

import { appendWhatsAppConversationMessage } from '@/lib/whatsapp/conversations'
import { sendWhatsAppTextWithRetry } from '@/lib/whatsapp/send'

export type DeliverWhatsAppReplyInput = {
  conversationId: string
  toE164: string
  body: string
  idempotencyKey?: string | null
  payload?: Record<string, unknown>
}

export type DeliverWhatsAppReplyResult =
  | { ok: true; providerMessageId: string | null; sent: boolean }
  | { ok: false; message: string }

/**
 * Persist outbound message and deliver via Meta API when configured.
 * If API is not configured, still logs outbound for ops review (dev/staging).
 */
export async function deliverWhatsAppReply(
  input: DeliverWhatsAppReplyInput,
): Promise<DeliverWhatsAppReplyResult> {
  const sendResult = await sendWhatsAppTextWithRetry({
    toE164: input.toE164,
    body: input.body,
  })

  const sent = sendResult.ok
  const providerMessageId = sendResult.ok ? sendResult.providerMessageId : null

  if (!sendResult.ok && sendResult.code !== 'not_configured') {
    await appendWhatsAppConversationMessage({
      conversationId: input.conversationId,
      direction: 'system',
      body: `[delivery failed] ${input.body}`,
      messageType: 'system',
      payload: { deliveryError: sendResult.message, ...(input.payload ?? {}) },
      idempotencyKey: input.idempotencyKey ? `fail:${input.idempotencyKey}` : null,
    })
    return { ok: false, message: sendResult.message }
  }

  await appendWhatsAppConversationMessage({
    conversationId: input.conversationId,
    direction: 'outbound',
    body: input.body,
    messageType: 'text',
    providerMessageId,
    idempotencyKey: input.idempotencyKey ?? null,
    payload: {
      sent,
      providerConfigured: sendResult.code !== 'not_configured',
      ...(input.payload ?? {}),
    },
  })

  return { ok: true, providerMessageId, sent }
}
