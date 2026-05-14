'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { buildAnalyticsHref, type AnalyticsPresetId } from '@/lib/admin/analytics-range'

/**
 * Client navigation for admin analytics date presets (wraps `router.push` in a transition).
 */
export function useAdminAnalyticsFilters() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigatePreset = (preset: Exclude<AnalyticsPresetId, 'custom'>) => {
    startTransition(() => {
      router.push(buildAnalyticsHref({ preset }))
    })
  }

  const navigateCustom = (from: string, to: string) => {
    startTransition(() => {
      router.push(buildAnalyticsHref({ preset: 'custom', from, to }))
    })
  }

  return { isPending, navigatePreset, navigateCustom }
}
