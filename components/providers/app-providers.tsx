'use client'

import type { ReactNode } from 'react'

import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

type AppProvidersProps = {
  children: ReactNode
}

/** Root client providers (Supabase, theme, etc.) */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <SupabaseProvider>{children}</SupabaseProvider>
    </ThemeProvider>
  )
}
