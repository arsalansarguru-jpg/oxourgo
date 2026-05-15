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

  async createPaymentOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
    void input
    return notConfigured()
  },

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    void input
    return notConfiguredVerify()
  },

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    void input
    return notConfiguredRefund()
  },

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusResult> {
    void input
    return notConfiguredStatus()
  },
}
