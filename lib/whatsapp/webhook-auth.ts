import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

/** Verify Meta WhatsApp webhook signature (X-Hub-Signature-256). */
export function verifyWhatsAppWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith('sha256=')) return false
  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')
  const received = signatureHeader.slice('sha256='.length)
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'))
  } catch {
    return false
  }
}

export function whatsAppWebhookVerifyToken(): string | null {
  return process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() || null
}

export function whatsAppAppSecret(): string | null {
  return process.env.WHATSAPP_APP_SECRET?.trim() || null
}

export function isWhatsAppWebhookConfigured(): boolean {
  return Boolean(whatsAppAppSecret() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim())
}
