/** Product area tags for Sentry issues (keep values low-cardinality). */
export const OXOUR_SENTRY_DOMAINS = ['booking', 'auth', 'kyc', 'admin', 'payments', 'notifications'] as const

export type OxourSentryDomain = (typeof OXOUR_SENTRY_DOMAINS)[number]
