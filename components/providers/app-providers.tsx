'use client'

import type { ReactNode } from 'react'

import { OxPosthogProvider } from '@/components/providers/posthog-provider'
import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

type AppProvidersProps = {
  children: ReactNode
}

/** Root client providers (PostHog, Supabase, theme, etc.) */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <OxPosthogProvider>
      <ThemeProvider>
        <SupabaseProvider>{children}</SupabaseProvider>
      </ThemeProvider>
    </OxPosthogProvider>
  )
}
