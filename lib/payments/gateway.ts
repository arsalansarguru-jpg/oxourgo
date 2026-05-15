import type {
  CreatePaymentOrderInput,
  CreatePaymentOrderResult,
  GetPaymentStatusInput,
  GetPaymentStatusResult,
  PaymentGatewayId,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from '@/lib/payments/types'

/** Provider-agnostic payment gateway contract. */
export interface PaymentGateway {
  readonly id: PaymentGatewayId
  readonly configured: boolean

  createPaymentOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult>
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>
  refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult>
  getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusResult>
}
