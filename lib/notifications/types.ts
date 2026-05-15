export const NOTIFICATION_TYPES = [
  'booking_received',
  'booking_approved',
  'booking_rejected',
  'booking_cancelled',
  'kyc_submitted',
  'kyc_approved',
  'kyc_rejected',
  'payment_pending',
  'payment_updated',
  'trip_reminder',
  'return_reminder',
  'trip_started',
  'trip_completed',
  'invoice_sent',
] as const

export type NotificationTypeId = (typeof NOTIFICATION_TYPES)[number]
