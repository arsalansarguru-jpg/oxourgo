import 'server-only'

import { getBookingNotifyContext } from '@/lib/notifications/context'
import { notifyCustomer, notifyOps } from '@/lib/notifications/emit'

function pickupSnippet(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
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
    title: 'Payment pending',
    body: 'Payment will be due once your booking is approved. You can track status from your dashboard.',
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
      body: 'A payment action is required for your booking.',
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
