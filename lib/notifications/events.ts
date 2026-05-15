import 'server-only'

import type { Json } from '@/lib/supabase/database.types'
import { enqueueOutboundEmail } from '@/lib/notifications/channels/outbound-enqueue'
import { getBookingNotifyContext } from '@/lib/notifications/context'
import { notifyCustomer, notifyOps } from '@/lib/notifications/emit'

function pickupSnippet(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function customerPayload(userId: string, bookingId: string, extra?: Record<string, unknown>): Json {
  return { audience: 'customer', user_id: userId, booking_id: bookingId, ...extra } as Json
}

function opsBookingPayload(bookingId: string, note?: string | null): Json {
  return { audience: 'ops', booking_id: bookingId, note: note ?? null } as Json
}

function opsKycPayload(userId: string, documentType: string, documentId: string): Json {
  return { audience: 'ops', user_id: userId, document_type: documentType, kyc_document_id: documentId } as Json
}

export async function onBookingCreated(bookingId: string): Promise<void> {
  const ctx = await getBookingNotifyContext(bookingId)
  if (!ctx) return
  const meta = { booking_id: bookingId }
  const car = ctx.car_label ? ` for ${ctx.car_label}` : ''
  await notifyCustomer({
    userId: ctx.user_id,
    type: 'booking_received',
    title: 'Booking confirmation',
    body: `We received your reservation${car}. Our team will review it shortly. Pickup ${pickupSnippet(ctx.pickup_date)}.`,
    metadata: meta,
  })
  await notifyCustomer({
    userId: ctx.user_id,
    type: 'payment_pending',
    title: 'Pay at pickup',
    body: ctx.car_label
      ? `Reservation received for ${ctx.car_label}. Rental is settled at pickup unless you chose another method.`
      : 'Reservation received. Rental is settled at pickup unless you chose another method.',
    metadata: meta,
  })
  await notifyOps({
    type: 'booking_pending_review',
    title: 'New booking pending review',
    body: ctx.car_label
      ? `${ctx.car_label} · pickup ${pickupSnippet(ctx.pickup_date)}`
      : `Pickup ${pickupSnippet(ctx.pickup_date)}`,
    metadata: { ...meta, customer_user_id: ctx.user_id },
  })

  void enqueueOutboundEmail({
    idempotencyKey: `email:customer_booking_confirmation:${bookingId}`,
    templateKey: 'customer_booking_confirmation',
    payload: customerPayload(ctx.user_id, bookingId),
  })
  void enqueueOutboundEmail({
    idempotencyKey: `email:ops_new_booking:${bookingId}`,
    templateKey: 'ops_new_booking',
    payload: opsBookingPayload(bookingId),
  })
}

export async function onBookingApproved(bookingId: string): Promise<void> {
  const ctx = await getBookingNotifyContext(bookingId)
  if (!ctx) return
  await notifyCustomer({
    userId: ctx.user_id,
    type: 'booking_approved',
    title: 'Booking approved',
    body: ctx.car_label
      ? `Your trip with ${ctx.car_label} is approved. Pickup ${pickupSnippet(ctx.pickup_date)}.`
      : `Your trip is approved. Pickup ${pickupSnippet(ctx.pickup_date)}.`,
    metadata: { booking_id: bookingId },
  })
  void enqueueOutboundEmail({
    idempotencyKey: `email:customer_booking_approved:${bookingId}`,
    templateKey: 'customer_booking_approved',
    payload: customerPayload(ctx.user_id, bookingId),
  })
}

export async function onBookingRejected(bookingId: string, note?: string | null): Promise<void> {
  const ctx = await getBookingNotifyContext(bookingId)
  if (!ctx) return
  await notifyCustomer({
    userId: ctx.user_id,
    type: 'booking_rejected',
    title: 'Booking not approved',
    body: note?.trim()
      ? `This request could not be approved. Note: ${note.trim()}`
      : 'This booking request could not be approved. Please choose another vehicle or dates.',
    metadata: { booking_id: bookingId },
  })
  await notifyOps({
    type: 'booking_rejected_ops',
    title: 'Booking not approved',
    body: ctx.car_label
      ? `${ctx.car_label} · pickup ${pickupSnippet(ctx.pickup_date)}`
      : `Pickup ${pickupSnippet(ctx.pickup_date)}`,
    metadata: { booking_id: bookingId, customer_user_id: ctx.user_id, note: note?.trim() ?? null },
  })
  void enqueueOutboundEmail({
    idempotencyKey: `email:customer_booking_rejected:${bookingId}`,
    templateKey: 'customer_booking_rejected',
    payload: customerPayload(ctx.user_id, bookingId, { note: note?.trim() ?? null }),
  })
  void enqueueOutboundEmail({
    idempotencyKey: `email:ops_booking_rejected:${bookingId}`,
    templateKey: 'ops_booking_cancellation',
    payload: opsBookingPayload(bookingId, note),
  })
}

export async function onBookingCancelled(bookingId: string, note?: string | null): Promise<void> {
  const ctx = await getBookingNotifyContext(bookingId)
  if (!ctx) return
  await notifyCustomer({
    userId: ctx.user_id,
    type: 'booking_cancelled',
    title: 'Booking cancelled',
    body: note?.trim() ? `Your booking was cancelled. ${note.trim()}` : 'Your booking was cancelled.',
    metadata: { booking_id: bookingId },
  })
  await notifyOps({
    type: 'booking_cancelled_ops',
    title: 'Booking cancelled',
    body: ctx.car_label
      ? `${ctx.car_label} · pickup ${pickupSnippet(ctx.pickup_date)}`
      : `Pickup ${pickupSnippet(ctx.pickup_date)}`,
    metadata: { booking_id: bookingId, customer_user_id: ctx.user_id, note: note?.trim() ?? null },
  })
  void enqueueOutboundEmail({
    idempotencyKey: `email:ops_booking_cancelled:${bookingId}`,
    templateKey: 'ops_booking_cancellation',
    payload: opsBookingPayload(bookingId, note),
  })
}

export async function onTripStarted(bookingId: string): Promise<void> {
  const ctx = await getBookingNotifyContext(bookingId)
  if (!ctx) return
  const car = ctx.car_label ? `${ctx.car_label}` : 'Your vehicle'
  await notifyCustomer({
    userId: ctx.user_id,
    type: 'trip_started',
    title: 'Trip started',
    body: `${car} handoff is complete. Have a safe journey.`,
    metadata: { booking_id: bookingId },
  })
}

export async function onTripCompleted(bookingId: string): Promise<void> {
  const ctx = await getBookingNotifyContext(bookingId)
  if (!ctx) return
  await notifyCustomer({
    userId: ctx.user_id,
    type: 'trip_completed',
    title: 'Trip completed',
    body: 'Thank you for choosing Oxour Go. We hope to see you on the road again soon.',
    metadata: { booking_id: bookingId },
  })
  await notifyCustomer({
    userId: ctx.user_id,
    type: 'invoice_sent',
    title: 'Invoice ready',
    body: 'Your itemized rental invoice is available in email and from your booking.',
    metadata: { booking_id: bookingId },
  })
  void enqueueOutboundEmail({
    idempotencyKey: `email:customer_trip_completed:${bookingId}`,
    templateKey: 'customer_trip_completed',
    payload: customerPayload(ctx.user_id, bookingId),
  })
  void enqueueOutboundEmail({
    idempotencyKey: `email:customer_invoice_attached:${bookingId}`,
    templateKey: 'customer_invoice_attached',
    payload: customerPayload(ctx.user_id, bookingId),
  })
}

export async function onPaymentStatusChanged(
  bookingId: string,
  paymentStatus: string,
  previous?: string | null,
): Promise<void> {
  const ctx = await getBookingNotifyContext(bookingId)
  if (!ctx) return
  const meta = { booking_id: bookingId, payment_status: paymentStatus, previous_payment_status: previous ?? null }
  if (paymentStatus === 'pending') {
    await notifyCustomer({
      userId: ctx.user_id,
      type: 'payment_pending',
      title: 'Payment pending',
      body: 'Your rental balance is still outstanding. Open the booking for the amount due and payment instructions.',
      metadata: meta,
    })
    return
  }
  if (paymentStatus === 'received') {
    await notifyCustomer({
      userId: ctx.user_id,
      type: 'payment_updated',
      title: 'Payment received',
      body: 'We recorded your rental payment in full. Thank you — see your booking for the receipt summary.',
      metadata: meta,
    })
    return
  }
  if (paymentStatus === 'partial') {
    await notifyCustomer({
      userId: ctx.user_id,
      type: 'payment_updated',
      title: 'Partial payment recorded',
      body: 'A partial rental payment was applied. Your dashboard shows the remaining balance due.',
      metadata: meta,
    })
    return
  }
  if (paymentStatus === 'refunded') {
    await notifyCustomer({
      userId: ctx.user_id,
      type: 'payment_updated',
      title: 'Refund recorded',
      body: 'This booking was marked refunded in our operations ledger. Contact concierge if anything looks off.',
      metadata: meta,
    })
    return
  }
  await notifyCustomer({
    userId: ctx.user_id,
    type: 'payment_updated',
    title: 'Payment status updated',
    body: `Payment is now: ${paymentStatus.replace(/_/g, ' ')}.`,
    metadata: meta,
  })
}

export async function onKycSubmitted(userId: string, documentId: string, documentType: string): Promise<void> {
  await notifyCustomer({
    userId,
    type: 'kyc_submitted',
    title: 'KYC submitted',
    body: `We received your ${documentType.replace(/_/g, ' ')} document and will review it shortly.`,
    metadata: { kyc_document_id: documentId, document_type: documentType },
  })
  await notifyOps({
    type: 'kyc_review',
    title: 'KYC needs review',
    body: `New ${documentType} upload from customer.`,
    metadata: { kyc_document_id: documentId, customer_user_id: userId, document_type: documentType },
  })
  void enqueueOutboundEmail({
    idempotencyKey: `email:ops_kyc_submission:${documentId}`,
    templateKey: 'ops_kyc_submission',
    payload: opsKycPayload(userId, documentType, documentId),
  })
}

export async function onKycDecision(
  userId: string,
  documentId: string,
  documentType: string,
  status: 'approved' | 'rejected' | 'resubmission_required',
  customerNote?: string | null,
): Promise<void> {
  const label = documentType.replace(/_/g, ' ')
  if (status === 'approved') {
    await notifyCustomer({
      userId,
      type: 'kyc_approved',
      title: 'KYC approved',
      body: `Your ${label} document was approved.`,
      metadata: { kyc_document_id: documentId, document_type: documentType },
    })
    return
  }
  if (status === 'resubmission_required') {
    await notifyCustomer({
      userId,
      type: 'kyc_rejected',
      title: 'KYC resubmission requested',
      body: customerNote?.trim()
        ? `Please upload a new ${label} document. ${customerNote.trim()}`
        : `Please upload a new ${label} document with the corrections we need.`,
      metadata: { kyc_document_id: documentId, document_type: documentType, kyc_decision: 'resubmission_required' },
    })
    return
  }
  await notifyCustomer({
    userId,
    type: 'kyc_rejected',
    title: 'KYC needs attention',
    body: customerNote?.trim()
      ? `Your ${label} document was rejected: ${customerNote.trim()}`
      : `Your ${label} document was rejected. Please upload a clearer copy.`,
    metadata: { kyc_document_id: documentId, document_type: documentType },
  })
}

export async function onOpsPaymentLedger(bookingId: string, title: string): Promise<void> {
  await notifyOps({
    type: 'payment_ops',
    title: 'Payment ledger activity',
    body: title,
    metadata: { booking_id: bookingId },
  })
}
