import {
  BOOKING_PAYMENT_METHODS,
  LEGACY_ONLINE_PAYMENT_METHOD,
  type BookingPaymentMethod,
} from '@/lib/payments/types'

export { BOOKING_PAYMENT_METHODS, type BookingPaymentMethod }

export function normalizeBookingPaymentMethod(raw: string | null | undefined): BookingPaymentMethod {
  const m = (raw ?? 'pay_at_pickup').trim().toLowerCase()
  if (m === 'online_payment' || m === LEGACY_ONLINE_PAYMENT_METHOD || m === 'pay_online') {
    return 'online_payment'
  }
  return 'pay_at_pickup'
}

export function formatPaymentMethodLabel(method: string | null | undefined): string {
  return normalizeBookingPaymentMethod(method) === 'online_payment' ? 'Pay online' : 'Pay at pickup'
}

export function isOnlinePaymentMethod(method: string | null | undefined): boolean {
  return normalizeBookingPaymentMethod(method) === 'online_payment'
}

export function payAtPickupInstructions(): string[] {
  return [
    'Bring a valid driving licence and the card used for any pre-authorisation.',
    'Rental balance is collected at the hub before handover — UPI, NEFT, or card as arranged by concierge.',
    'Security deposit is a separate pre-auth at pickup; it is released after return inspection when eligible.',
  ]
}

export function onlinePaymentInstructions(): string[] {
  return [
    'When online checkout is enabled, you will pay the rental balance securely before pickup.',
    'Your booking stays pending until payment is confirmed.',
    'Security deposit remains a separate pre-auth at the hub unless stated otherwise.',
  ]
}
