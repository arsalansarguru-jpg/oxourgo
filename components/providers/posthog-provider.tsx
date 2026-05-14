'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider } from '@posthog/react'

import { captureClientEvent } from '@/lib/analytics/capture-client'
import { buildPosthogClientOptions } from '@/lib/analytics/posthog-client-options'
import { getPosthogProjectKey, isPosthogEnabled } from '@/lib/analytics/posthog-env'

type OxPosthogProviderProps = {
  children: React.ReactNode
}

/**
 * Initializes PostHog only when enabled (prod by default, dev with `NEXT_PUBLIC_POSTHOG_ENABLE_DEV=1`).
 * Session replay uses masked inputs/text; autocapture is off — use explicit `captureClientEvent` calls.
 */
export function OxPosthogProvider({ children }: OxPosthogProviderProps) {
  const key = getPosthogProjectKey()
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!key || !isPosthogEnabled()) return
    if (!posthog.__loaded) {
      posthog.init(key, buildPosthogClientOptions())
    }
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    captureClientEvent('$pageview', { path: pathname })
  }, [key, pathname])

  if (!key || !isPosthogEnabled()) {
    return <>{children}</>
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
