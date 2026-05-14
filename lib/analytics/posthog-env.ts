/**
 * PostHog is disabled unless a project key is set.
 * In development, set `NEXT_PUBLIC_POSTHOG_ENABLE_DEV=1` to send events (use a dev project).
 */
export function isPosthogEnabled(): boolean {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()
  if (!key) return false
  if (process.env.NEXT_PUBLIC_POSTHOG_DISABLED === '1') return false
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_POSTHOG_ENABLE_DEV === '1'
  }
  return true
}

export function getPosthogHost(): string {
  return (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com').replace(/\/$/, '')
}

export function getPosthogProjectKey(): string | undefined {
  const k = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()
  return k || undefined
}

export function getAnalyticsEnvironment(): string {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_ENVIRONMENT?.trim() ||
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim() ||
    process.env.VERCEL_ENV?.trim() ||
    process.env.NODE_ENV ||
    'development'
  )
}
