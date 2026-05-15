import type { PaymentGatewayId, PaymentWebhookEvent } from '@/lib/payments/types'

export type PaymentWebhookHeaders = {
  signature?: string | null
  eventId?: string | null
}

export function parsePaymentWebhookHeaders(headers: Headers): PaymentWebhookHeaders {
  return {
    signature:
      headers.get('x-razorpay-signature') ??
      headers.get('X-Razorpay-Signature') ??
      null,
    eventId:
      headers.get('x-razorpay-event-id') ??
      headers.get('X-Razorpay-Event-Id') ??
      null,
  }
}

/** Build a normalized webhook event for future idempotent processing. */
export function buildPaymentWebhookEvent(input: {
  gateway: PaymentGatewayId
  eventType: string
  rawBody: string
  payload?: Record<string, unknown>
}): PaymentWebhookEvent {
  const payload = input.payload ?? safeJsonParse(input.rawBody)
  const entity = extractEntity(payload)

  return {
    gateway: input.gateway,
    eventType: input.eventType,
    rawBody: input.rawBody,
    receivedAt: new Date().toISOString(),
    bookingId: pickString(entity?.notes, 'booking_id') ?? pickString(payload, 'booking_id'),
    orderId: pickString(entity, 'order_id') ?? pickString(entity, 'id'),
    paymentId: pickString(entity, 'payment_id') ?? pickString(payload?.payload, 'payment', 'entity', 'id'),
  }
}

function safeJsonParse(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function extractEntity(payload: Record<string, unknown>): Record<string, unknown> | null {
  const p = payload.payload
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null
  const payment = (p as Record<string, unknown>).payment
  if (payment && typeof payment === 'object' && !Array.isArray(payment)) {
    const ent = (payment as Record<string, unknown>).entity
    if (ent && typeof ent === 'object' && !Array.isArray(ent)) return ent as Record<string, unknown>
  }
  return null
}

function pickString(obj: unknown, ...path: string[]): string | null {
  let cur: unknown = obj
  for (const key of path) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return null
    cur = (cur as Record<string, unknown>)[key]
  }
  return typeof cur === 'string' && cur.trim() ? cur.trim() : null
}
