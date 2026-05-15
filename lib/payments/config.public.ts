/**
 * Browser-safe payment config — no secrets.
 * Mirrors server flags using only NEXT_PUBLIC_* vars for UI hints.
 */

export type OnlinePaymentUiState = {
  /** True when publishable Razorpay key is present (checkout may still be disabled server-side). */
  razorpayKeyPresent: boolean
  /** When false, show "Online payments coming soon". */
  checkoutAvailable: boolean
}

export function getOnlinePaymentUiState(): OnlinePaymentUiState {
  const keyPresent = Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim())
  const checkoutFlag = process.env.NEXT_PUBLIC_PAYMENTS_ONLINE_CHECKOUT_ENABLED === '1'
  return {
    razorpayKeyPresent: keyPresent,
    checkoutAvailable: keyPresent && checkoutFlag,
  }
}

export const ONLINE_PAYMENTS_COMING_SOON_MESSAGE = 'Online payments coming soon'
