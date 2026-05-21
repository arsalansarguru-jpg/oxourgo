/**
 * Canonical admin status values — aligned with Supabase CHECK constraints.
 * Use these in filters, pills, and query `.eq()` / `.in()` calls.
 */

export const BOOKING_STATUSES = [
  'pending_payment',
  'confirmed',
  'active',
  'completed',
  'cancelled',
] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const PAYMENT_STATUSES = ['pending', 'received', 'partial', 'refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

/** Aggregate profile KYC lifecycle (profiles.kyc_status). */
export const PROFILE_KYC_STATUSES = [
  'not_started',
  'pending',
  'approved',
  'rejected',
  'resubmission_required',
] as const
export type ProfileKycStatus = (typeof PROFILE_KYC_STATUSES)[number]

/** Per-document KYC state (kyc_documents.status). */
export const KYC_DOCUMENT_STATUSES = [
  'pending',
  'reviewing',
  'approved',
  'rejected',
  'resubmission_required',
] as const
export type KycDocumentStatus = (typeof KYC_DOCUMENT_STATUSES)[number]

/** Ledger events (payment_events.status). */
export const PAYMENT_EVENT_STATUSES = ['pending', 'posted', 'void'] as const
export type PaymentEventStatus = (typeof PAYMENT_EVENT_STATUSES)[number]

/** Document statuses that appear in the admin “in review” queue. */
export const KYC_IN_REVIEW_DOCUMENT_STATUSES: KycDocumentStatus[] = ['pending', 'reviewing']

export function normalizeBookingStatus(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase()
}

export function normalizePaymentStatus(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase()
}

export function isPostedPaymentEventStatus(raw: string | null | undefined): boolean {
  const st = (raw ?? '').trim().toLowerCase()
  return st === 'posted' || st === 'completed' || st === 'succeeded'
}
