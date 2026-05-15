import 'server-only'

import type { PaymentCheckoutStatus, PaymentGatewayId } from '@/lib/payments/types'

export type BookingGatewayPatch = {
  payment_gateway: PaymentGatewayId | null
  payment_gateway_order_id: string | null
  payment_gateway_payment_id: string | null
  payment_checkout_status: PaymentCheckoutStatus
  updated_at: string
}

export function buildBookingGatewayPatch(input: {
  gateway: PaymentGatewayId
  orderId?: string | null
  paymentId?: string | null
  checkoutStatus: PaymentCheckoutStatus
}): BookingGatewayPatch {
  return {
    payment_gateway: input.gateway,
    payment_gateway_order_id: input.orderId ?? null,
    payment_gateway_payment_id: input.paymentId ?? null,
    payment_checkout_status: input.checkoutStatus,
    updated_at: new Date().toISOString(),
  }
}
