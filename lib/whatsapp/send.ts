import 'server-only'

import { whatsAppAccessToken, whatsAppApiBaseUrl, whatsAppPhoneNumberId } from '@/lib/whatsapp/config'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type SendWhatsAppTextInput = {
  toE164: string
  body: string
  /** Meta idempotency for retries (optional). */
  bizOpaqueCallbackData?: string
}

export type SendWhatsAppTextResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; code: 'not_configured' | 'api_error'; message: string }

function digitsForMetaApi(e164: string): string {
  return e164.replace(/\D/g, '')
}

/**
 * Send a text message via Meta WhatsApp Cloud API.
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages
 */
export async function sendWhatsAppText(input: SendWhatsAppTextInput): Promise<SendWhatsAppTextResult> {
  const token = whatsAppAccessToken()
  const phoneId = whatsAppPhoneNumberId()
  if (!token || !phoneId) {
    return { ok: false, code: 'not_configured', message: 'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing.' }
  }

  const to = digitsForMetaApi(input.toE164)
  if (to.length < 10) {
    return { ok: false, code: 'api_error', message: 'Invalid recipient phone.' }
  }

  const url = `${whatsAppApiBaseUrl()}/${phoneId}/messages`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: true, body: input.body.slice(0, 4096) },
      }),
    })

    const json = (await res.json().catch(() => ({}))) as {
      messages?: Array<{ id: string }>
      error?: { message?: string; code?: number }
    }

    if (!res.ok) {
      const msg = json.error?.message ?? `HTTP ${res.status}`
      logPostgrestError('[sendWhatsAppText]', { message: msg })
      return { ok: false, code: 'api_error', message: msg }
    }

    const providerMessageId = json.messages?.[0]?.id
    if (!providerMessageId) {
      return { ok: false, code: 'api_error', message: 'No message id in provider response.' }
    }

    return { ok: true, providerMessageId }
  } catch (e) {
    logPostgrestError('[sendWhatsAppText]', e)
    return { ok: false, code: 'api_error', message: e instanceof Error ? e.message : 'Send failed.' }
  }
}

/** Retry send with exponential backoff (production-safe for transient Meta errors). */
export async function sendWhatsAppTextWithRetry(
  input: SendWhatsAppTextInput,
  maxAttempts = 3,
): Promise<SendWhatsAppTextResult> {
  let last: SendWhatsAppTextResult = { ok: false, code: 'api_error', message: 'No attempts.' }
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    last = await sendWhatsAppText(input)
    if (last.ok) return last
    if (last.code === 'not_configured') return last
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 400 * attempt))
    }
  }
  return last
}
