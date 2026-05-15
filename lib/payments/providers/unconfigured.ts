import type { PaymentGateway } from '@/lib/payments/gateway'
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

const MESSAGE = 'Online payments are not configured yet. Use pay at pickup to complete your booking.'

function notConfigured(): CreatePaymentOrderResult {
  return { ok: false, code: 'not_configured', message: MESSAGE }
}

function notConfiguredVerify(): VerifyPaymentResult {
  return { ok: false, code: 'not_configured', message: MESSAGE }
}

function notConfiguredRefund(): RefundPaymentResult {
  return { ok: false, code: 'not_configured', message: MESSAGE }
}

function notConfiguredStatus(): GetPaymentStatusResult {
  return { ok: false, code: 'not_configured', message: MESSAGE }
}

export const unconfiguredPaymentGateway: PaymentGateway = {
  id: 'unconfigured',
  configured: false,

  async createPaymentOrder(_input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
    return notConfigured()
  },

  async verifyPayment(_input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    return notConfiguredVerify()
  },

  async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentResult> {
    return notConfiguredRefund()
  },

  async getPaymentStatus(_input: GetPaymentStatusInput): Promise<GetPaymentStatusResult> {
    return notConfiguredStatus()
  },
}
