import 'server-only'

import type { PaymentGateway } from '@/lib/payments/gateway'
import { isRazorpayConfigured } from '@/lib/payments/config'
import { razorpayPaymentGateway } from '@/lib/payments/providers/razorpay'
import { unconfiguredPaymentGateway } from '@/lib/payments/providers/unconfigured'
import type {
  CreatePaymentOrderInput,
  CreatePaymentOrderResult,
  GetPaymentStatusInput,
  GetPaymentStatusResult,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from '@/lib/payments/types'

export function getPaymentGateway(): PaymentGateway {
  if (isRazorpayConfigured()) return razorpayPaymentGateway
  return unconfiguredPaymentGateway
}

export async function createPaymentOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
  return getPaymentGateway().createPaymentOrder(input)
}

export async function verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
  return getPaymentGateway().verifyPayment(input)
}

export async function refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult> {
  return getPaymentGateway().refundPayment(input)
}

export async function getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusResult> {
  return getPaymentGateway().getPaymentStatus(input)
}
