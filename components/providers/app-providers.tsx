'use client'

import type { ReactNode } from 'react'

import { SupabaseProvider } from '@/components/providers/supabase-provider'

type AppProvidersProps = {
  children: ReactNode
  supabaseUrl: string | null
  supabaseAnonKey: string | null
}

/** Root client providers (Supabase, future query client, etc.) */
export function AppProviders({ children, supabaseUrl, supabaseAnonKey }: AppProvidersProps) {
  return (
    <SupabaseProvider supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey}>
      {children}
    </SupabaseProvider>
  )
}
