import 'server-only'

import type { PaymentGateway } from '@/lib/payments/gateway'
import {
  getRazorpayKeyId,
  isOnlineCheckoutAvailable,
  isRazorpayConfigured,
} from '@/lib/payments/config'
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

const DISABLED_MESSAGE =
  'Online checkout is not enabled yet. Choose pay at pickup or contact concierge.'

function disabledCreate(): CreatePaymentOrderResult {
  return { ok: false, code: 'disabled', message: DISABLED_MESSAGE }
}

function disabledVerify(): VerifyPaymentResult {
  return { ok: false, code: 'disabled', message: DISABLED_MESSAGE }
}

function disabledRefund(): RefundPaymentResult {
  return { ok: false, code: 'disabled', message: DISABLED_MESSAGE }
}

function disabledStatus(): GetPaymentStatusResult {
  return { ok: false, code: 'disabled', message: DISABLED_MESSAGE }
}

function notConfiguredCreate(): CreatePaymentOrderResult {
  return { ok: false, code: 'not_configured', message: 'Razorpay credentials are not configured.' }
}

function notConfiguredVerify(): VerifyPaymentResult {
  return { ok: false, code: 'not_configured', message: 'Razorpay credentials are not configured.' }
}

function notConfiguredRefund(): RefundPaymentResult {
  return { ok: false, code: 'not_configured', message: 'Razorpay credentials are not configured.' }
}

function notConfiguredStatus(): GetPaymentStatusResult {
  return { ok: false, code: 'not_configured', message: 'Razorpay credentials are not configured.' }
}

/**
 * Razorpay gateway stub — implements the contract without calling live APIs.
 * Replace method bodies with Razorpay SDK/REST when checkout is enabled.
 */
export const razorpayPaymentGateway: PaymentGateway = {
  id: 'razorpay',
  configured: isRazorpayConfigured(),

  async createPaymentOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
    if (!isRazorpayConfigured()) return notConfiguredCreate()
    if (!isOnlineCheckoutAvailable()) return disabledCreate()

    const amount = Math.round(input.amountRupees)
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, code: 'validation', message: 'Invalid payment amount.' }
    }

    const keyId = getRazorpayKeyId()!
    const orderId = `order_stub_${input.bookingId.slice(0, 8)}_${Date.now()}`

    return {
      ok: true,
      gateway: 'razorpay',
      orderId,
      amountRupees: amount,
      currency: 'INR',
      publicKeyId: keyId,
      providerPayload: {
        stub: true,
        receipt: input.receipt ?? input.bookingId,
        notes: input.notes ?? {},
      },
    }
  },

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    if (!isRazorpayConfigured()) return notConfiguredVerify()
    if (!isOnlineCheckoutAvailable()) return disabledVerify()

    if (!input.orderId?.trim() || !input.paymentId?.trim() || !input.signature?.trim()) {
      return { ok: false, code: 'validation', message: 'Payment verification payload is incomplete.' }
    }

    return {
      ok: true,
      verified: false,
      paymentId: input.paymentId,
      orderId: input.orderId,
      status: 'unknown',
    }
  },

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    if (!isRazorpayConfigured()) return notConfiguredRefund()
    if (!isOnlineCheckoutAvailable()) return disabledRefund()

    if (!input.paymentId?.trim()) {
      return { ok: false, code: 'validation', message: 'Payment id is required for a refund.' }
    }

    return {
      ok: true,
      refundId: `rfnd_stub_${Date.now()}`,
      amountRupees: Math.max(0, Math.round(input.amountRupees ?? 0)),
      status: 'refunded',
    }
  },

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusResult> {
    if (!isRazorpayConfigured()) return notConfiguredStatus()
    if (!isOnlineCheckoutAvailable()) return disabledStatus()

    if (!input.orderId?.trim() && !input.paymentId?.trim()) {
      return { ok: false, code: 'not_found', message: 'No gateway reference on this booking.' }
    }

    return {
      ok: true,
      status: 'created',
      orderId: input.orderId ?? null,
      paymentId: input.paymentId ?? null,
      amountRupees: null,
    }
  },
}
