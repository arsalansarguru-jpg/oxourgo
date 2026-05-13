'use client'

import { createContext, useMemo, type ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { readSupabasePublicEnv } from '@/lib/env/supabase-public'
import type { Database } from '@/lib/supabase/database.types'

export const SupabaseContext = createContext<SupabaseClient<Database> | null>(null)

type SupabaseProviderProps = {
  children: ReactNode
}

/**
 * Browser Supabase client from `NEXT_PUBLIC_*` env (inlined at build for the client bundle).
 * Reads config here so the root layout stays a simple server shell without passing secrets/URLs
 * across the server → client boundary.
 */
export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const supabase = useMemo(() => {
    try {
      const env = readSupabasePublicEnv()
      if (!env) return null
      return createBrowserSupabaseClient(env.url, env.anonKey)
    } catch {
      return null
    }
  }, [])

  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>
}
