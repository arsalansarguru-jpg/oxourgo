/** Payment gateway models — provider-agnostic, future Razorpay-ready. */

export const PAYMENT_GATEWAY_IDS = ['razorpay', 'unconfigured'] as const
export type PaymentGatewayId = (typeof PAYMENT_GATEWAY_IDS)[number]

export const BOOKING_PAYMENT_METHODS = ['pay_at_pickup', 'online_payment'] as const
export type BookingPaymentMethod = (typeof BOOKING_PAYMENT_METHODS)[number]

/** Legacy DB value — normalized to `online_payment` in app code. */
export const LEGACY_ONLINE_PAYMENT_METHOD = 'pay_online' as const

export const PAYMENT_CHECKOUT_STATUSES = [
  'not_started',
  'order_created',
  'authorized',
  'captured',
  'failed',
  'refunded',
] as const
export type PaymentCheckoutStatus = (typeof PAYMENT_CHECKOUT_STATUSES)[number]

export const GATEWAY_PAYMENT_STATUSES = [
  'created',
  'authorized',
  'captured',
  'failed',
  'refunded',
  'unknown',
] as const
export type GatewayPaymentStatus = (typeof GATEWAY_PAYMENT_STATUSES)[number]

export type MoneyRupees = number

export type CreatePaymentOrderInput = {
  bookingId: string
  userId: string
  amountRupees: MoneyRupees
  currency?: 'INR'
  receipt?: string
  notes?: Record<string, string>
}

export type CreatePaymentOrderSuccess = {
  ok: true
  gateway: PaymentGatewayId
  orderId: string
  amountRupees: MoneyRupees
  currency: 'INR'
  /** Public key for client checkout — never include secret. */
  publicKeyId?: string
  /** Provider-specific payload for future Checkout.js wiring. */
  providerPayload?: Record<string, unknown>
}

export type CreatePaymentOrderFailure = {
  ok: false
  code: 'not_configured' | 'disabled' | 'validation' | 'provider_error'
  message: string
}

export type CreatePaymentOrderResult = CreatePaymentOrderSuccess | CreatePaymentOrderFailure

export type VerifyPaymentInput = {
  bookingId: string
  orderId: string
  paymentId: string
  signature: string
}

export type VerifyPaymentSuccess = {
  ok: true
  verified: boolean
  paymentId: string
  orderId: string
  status: GatewayPaymentStatus
}

export type VerifyPaymentFailure = {
  ok: false
  code: 'not_configured' | 'disabled' | 'validation' | 'verification_failed' | 'provider_error'
  message: string
}

export type VerifyPaymentResult = VerifyPaymentSuccess | VerifyPaymentFailure

export type RefundPaymentInput = {
  bookingId: string
  paymentId: string
  amountRupees?: MoneyRupees
  reason?: string
}

export type RefundPaymentSuccess = {
  ok: true
  refundId: string
  amountRupees: MoneyRupees
  status: GatewayPaymentStatus
}

export type RefundPaymentFailure = {
  ok: false
  code: 'not_configured' | 'disabled' | 'validation' | 'provider_error'
  message: string
}

export type RefundPaymentResult = RefundPaymentSuccess | RefundPaymentFailure

export type GetPaymentStatusInput = {
  bookingId: string
  orderId?: string | null
  paymentId?: string | null
}

export type GetPaymentStatusSuccess = {
  ok: true
  status: GatewayPaymentStatus
  orderId: string | null
  paymentId: string | null
  amountRupees: MoneyRupees | null
}

export type GetPaymentStatusFailure = {
  ok: false
  code: 'not_configured' | 'disabled' | 'not_found' | 'provider_error'
  message: string
}

export type GetPaymentStatusResult = GetPaymentStatusSuccess | GetPaymentStatusFailure

/** Webhook envelope — parse provider payloads without coupling booking UI. */
export type PaymentWebhookEvent = {
  gateway: PaymentGatewayId
  eventType: string
  rawBody: string
  receivedAt: string
  bookingId?: string | null
  orderId?: string | null
  paymentId?: string | null
}

export type BookingPaymentGatewaySnapshot = {
  paymentGateway: PaymentGatewayId | null
  paymentGatewayOrderId: string | null
  paymentGatewayPaymentId: string | null
  paymentCheckoutStatus: PaymentCheckoutStatus
}
