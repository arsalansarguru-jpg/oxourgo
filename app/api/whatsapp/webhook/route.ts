import { NextResponse, type NextRequest } from 'next/server'

import { allowIpRateLimit, clientIpFromRequestHeaders } from '@/lib/api/simple-ip-rate-limit'
import { captureRouteException } from '@/lib/monitoring/capture-route-exception'
import { oxourWrapRouteHandler } from '@/lib/monitoring/oxour-wrap-route-handler'
import { processWhatsAppInbound } from '@/lib/whatsapp/process-inbound'
import type { WhatsAppInboundEvent } from '@/lib/whatsapp/assistant/types'
import { normalizeToE164 } from '@/lib/whatsapp/e164'
import {
  isWhatsAppWebhookConfigured,
  verifyWhatsAppWebhookSignature,
  whatsAppAppSecret,
  whatsAppWebhookVerifyToken,
} from '@/lib/whatsapp/webhook-auth'

const WEBHOOK_RATE_LIMIT = 120
const WEBHOOK_WINDOW_MS = 60_000

/** Meta Cloud API webhook verification (GET). */
async function webhookGET(request: NextRequest) {
  const token = whatsAppWebhookVerifyToken()
  if (!token) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const challenge = searchParams.get('hub.challenge')
  const verify = searchParams.get('hub.verify_token')

  if (mode === 'subscribe' && verify === token && challenge) {
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } })
  }

  return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
}

type MetaWebhookPayload = {
  object?: string
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: string
          text?: { body: string }
        }>
        contacts?: Array<{ wa_id: string }>
      }
    }>
  }>
}

function parseMetaInboundEvents(body: MetaWebhookPayload): WhatsAppInboundEvent[] {
  const events: WhatsAppInboundEvent[] = []
  if (body.object !== 'whatsapp_business_account') return events

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value
      for (const msg of value?.messages ?? []) {
        if (msg.type !== 'text' || !msg.text?.body) continue
        const e164 = normalizeToE164(msg.from.startsWith('+') ? msg.from : `+${msg.from}`)
        if (!e164) continue
        events.push({
          externalWaId: value?.contacts?.[0]?.wa_id ?? msg.from,
          fromE164: e164,
          messageId: msg.id,
          text: msg.text.body,
          timestamp: msg.timestamp,
        })
      }
    }
  }
  return events
}

/** Meta Cloud API message webhook (POST). */
async function webhookPOST(request: NextRequest) {
  const ip = clientIpFromRequestHeaders(request.headers)
  if (!allowIpRateLimit(`wa-webhook:${ip}`, WEBHOOK_RATE_LIMIT, WEBHOOK_WINDOW_MS)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  const rawBody = await request.text()
  const secret = whatsAppAppSecret()

  if (secret) {
    const sig = request.headers.get('x-hub-signature-256')
    if (!verifyWhatsAppWebhookSignature(rawBody, sig, secret)) {
      return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 })
    }
  } else if (!isWhatsAppWebhookConfigured()) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 })
  }

  let body: MetaWebhookPayload
  try {
    body = JSON.parse(rawBody) as MetaWebhookPayload
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const events = parseMetaInboundEvents(body)
  const results: Array<{ messageId: string; ok: boolean }> = []

  try {
    for (const event of events) {
      const result = await processWhatsAppInbound(event)
      results.push({ messageId: event.messageId, ok: result.ok })
    }
    return NextResponse.json({ ok: true, processed: results.length, results })
  } catch (e) {
    captureRouteException('notifications', 'POST /api/whatsapp/webhook', e)
    return NextResponse.json({ ok: false, error: 'processing_failed' }, { status: 500 })
  }
}

export const GET = oxourWrapRouteHandler(
  { method: 'GET', parameterizedRoute: '/api/whatsapp/webhook' },
  'notifications',
  webhookGET,
)

export const POST = oxourWrapRouteHandler(
  { method: 'POST', parameterizedRoute: '/api/whatsapp/webhook' },
  'notifications',
  webhookPOST,
)
