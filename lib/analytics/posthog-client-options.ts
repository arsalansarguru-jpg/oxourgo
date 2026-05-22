import type { PostHogConfig } from 'posthog-js'

import { getAnalyticsEnvironment, getPosthogHost } from '@/lib/analytics/posthog-env'

/** Browser PostHog init: privacy-first session replay; no DOM autocapture. */
export function buildPosthogClientOptions(): Partial<PostHogConfig> {
  return {
    api_host: getPosthogHost(),
    persistence: 'localStorage+cookie',
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: process.env.NEXT_PUBLIC_POSTHOG_DISABLE_REPLAY === '1',
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-private],[data-ph-mask]',
      blockSelector: '[data-ph-block]',
    },
    disable_surveys: true,
    loaded: (ph) => {
      ph.register({ analytics_environment: getAnalyticsEnvironment() })
    },
  }
}
