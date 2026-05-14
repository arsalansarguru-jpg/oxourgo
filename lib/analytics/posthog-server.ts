import 'server-only'

import { PostHog } from 'posthog-node'

import { getAnalyticsEnvironment, getPosthogHost, getPosthogProjectKey, isPosthogEnabled } from '@/lib/analytics/posthog-env'

type SafeProps = Record<string, string | number | boolean | undefined>

/** Server-side capture for auth callback, admin audit, etc. Flushes for serverless. */
export async function captureServerPosthogEvent(input: {
  distinctId: string
  event: string
  properties?: SafeProps
}): Promise<void> {
  if (!isPosthogEnabled()) return
  const key = getPosthogProjectKey()
  if (!key) return

  const client = new PostHog(key, {
    host: getPosthogHost(),
    flushAt: 1,
    flushInterval: 0,
  })

  try {
    client.capture({
      distinctId: input.distinctId,
      event: input.event,
      properties: {
        ...input.properties,
        analytics_environment: getAnalyticsEnvironment(),
        source: 'server',
      },
    })
  } finally {
    await client.shutdown()
  }
}
