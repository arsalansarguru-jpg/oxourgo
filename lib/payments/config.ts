import 'server-only'

/**
 * Razorpay / online checkout configuration (server-only secrets).
 * Online collection stays disabled until keys exist AND checkout is explicitly enabled.
 */

export type RazorpayPublicConfig = {
  keyId: string
  configured: boolean
  checkoutEnabled: boolean
}

function readEnv(name: string): string | undefined {
  const v = process.env[name]?.trim()
  return v || undefined
}

/** Publishable key — safe for future client Checkout (never the secret). */
export function getRazorpayKeyId(): string | undefined {
  return readEnv('RAZORPAY_KEY_ID') ?? readEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID')
}

/** Server-only secret — never import from client components. */
export function getRazorpayKeySecret(): string | undefined {
  return readEnv('RAZORPAY_KEY_SECRET')
}

export function isRazorpayConfigured(): boolean {
  return Boolean(getRazorpayKeyId() && getRazorpayKeySecret())
}

/** Extra guard: even with keys, checkout remains off until ops flips this flag. */
export function isOnlineCheckoutExplicitlyEnabled(): boolean {
  return readEnv('PAYMENTS_ONLINE_CHECKOUT_ENABLED') === '1'
}

export function isOnlineCheckoutAvailable(): boolean {
  return isRazorpayConfigured() && isOnlineCheckoutExplicitlyEnabled()
}

/** UI + booking actions: show "coming soon" when this is false. */
export function shouldShowOnlinePaymentsComingSoon(): boolean {
  return !isOnlineCheckoutAvailable()
}

export function getRazorpayPublicConfig(): RazorpayPublicConfig {
  const keyId = getRazorpayKeyId() ?? ''
  const configured = isRazorpayConfigured()
  return {
    keyId,
    configured,
    checkoutEnabled: isOnlineCheckoutAvailable(),
  }
}

export function getPaymentWebhookSecret(): string | undefined {
  return readEnv('RAZORPAY_WEBHOOK_SECRET')
}
