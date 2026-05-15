export const OUTBOUND_EMAIL_TEMPLATE_KEYS = [
  'customer_booking_confirmation',
  'customer_booking_approved',
  'customer_booking_rejected',
  'customer_trip_reminder',
  'customer_return_reminder',
  'customer_trip_completed',
  'customer_invoice_attached',
  'ops_new_booking',
  'ops_kyc_submission',
  'ops_booking_cancellation',
] as const

export type OutboundEmailTemplateKey = (typeof OUTBOUND_EMAIL_TEMPLATE_KEYS)[number]

export function isOutboundEmailTemplateKey(k: string): k is OutboundEmailTemplateKey {
  return (OUTBOUND_EMAIL_TEMPLATE_KEYS as readonly string[]).includes(k)
}
