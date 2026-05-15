import { NextResponse } from 'next/server'

import { getPaymentWebhookSecret, isRazorpayConfigured } from '@/lib/payments/config'
import { buildPaymentWebhookEvent, parsePaymentWebhookHeaders } from '@/lib/payments/webhook'

export const runtime = 'nodejs'

/**
 * Razorpay webhook endpoint (future-ready).
 * Returns 503 until credentials + webhook secret are configured.
 * Does not mutate bookings until checkout is explicitly enabled.
 */
export async function POST(request: Request) {
  if (!isRazorpayConfigured() || !getPaymentWebhookSecret()) {
    return NextResponse.json(
      { ok: false, message: 'Payment webhooks are not configured.' },
      { status: 503 },
    )
  }

  const rawBody = await request.text()
  const headers = parsePaymentWebhookHeaders(request.headers)

  const payload = safeJson(rawBody)
  const eventType =
    typeof payload.event === 'string' ? payload.event : headers.eventId ?? 'unknown'

  const event = buildPaymentWebhookEvent({
    gateway: 'razorpay',
    eventType,
    rawBody,
    payload,
  })

  // TODO: verify signature with RAZORPAY_WEBHOOK_SECRET, idempotent upsert, update booking checkout status.
  console.info('[razorpay-webhook] received', {
    eventType: event.eventType,
    bookingId: event.bookingId,
    orderId: event.orderId,
  })

  return NextResponse.json({ ok: true, received: true })
}

function safeJson(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}
