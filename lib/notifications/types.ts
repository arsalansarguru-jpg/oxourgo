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
] as const

export type NotificationTypeId = (typeof NOTIFICATION_TYPES)[number]
