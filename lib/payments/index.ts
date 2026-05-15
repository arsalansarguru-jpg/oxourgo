/**
 * Payment module — gateway abstraction, booking methods, webhook helpers.
 * Import server-only APIs from `@/lib/payments/server` in Route Handlers and Server Actions.
 */

export type {
  BookingPaymentMethod,
  BookingPaymentGatewaySnapshot,
  CreatePaymentOrderInput,
  CreatePaymentOrderResult,
  GatewayPaymentStatus,
  GetPaymentStatusInput,
  GetPaymentStatusResult,
  PaymentCheckoutStatus,
  PaymentGatewayId,
  PaymentWebhookEvent,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from '@/lib/payments/types'

export { BOOKING_PAYMENT_METHODS, PAYMENT_CHECKOUT_STATUSES, PAYMENT_GATEWAY_IDS } from '@/lib/payments/types'

export type { PaymentGateway } from '@/lib/payments/gateway'

export {
  formatPaymentMethodLabel,
  isOnlinePaymentMethod,
  normalizeBookingPaymentMethod,
  payAtPickupInstructions,
  onlinePaymentInstructions,
} from '@/lib/payments/methods'

export {
  getOnlinePaymentUiState,
  ONLINE_PAYMENTS_COMING_SOON_MESSAGE,
  type OnlinePaymentUiState,
} from '@/lib/payments/config.public'

export {
  bookingPaymentBreakdown,
  collectedRentalRupees,
  isPostedRentalPayment,
  normalizePaymentStatus,
  BOOKING_PAYMENT_STATUSES,
  type BookingPaymentBreakdown,
  type BookingPaymentStatus,
} from '@/lib/payments/booking-payment'

export { parsePaymentWebhookHeaders, buildPaymentWebhookEvent } from '@/lib/payments/webhook'
