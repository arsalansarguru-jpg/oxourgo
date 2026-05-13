'use client'

import type { ReactNode } from 'react'

import { SupabaseProvider } from '@/components/providers/supabase-provider'

type AppProvidersProps = {
  children: ReactNode
}

/** Root client providers (Supabase, future query client, etc.) */
export function AppProviders({ children }: AppProvidersProps) {
  return <SupabaseProvider>{children}</SupabaseProvider>
}
