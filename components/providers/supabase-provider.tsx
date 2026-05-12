'use client'

import { createContext, useMemo, type ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

export const SupabaseContext = createContext<SupabaseClient<Database> | null>(null)

type SupabaseProviderProps = {
  children: ReactNode
  /** From root server layout — reads `.env.local` on the server each request. */
  supabaseUrl: string | null
  supabaseAnonKey: string | null
}

export function SupabaseProvider({ children, supabaseUrl, supabaseAnonKey }: SupabaseProviderProps) {
  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null
    return createBrowserSupabaseClient(supabaseUrl, supabaseAnonKey)
  }, [supabaseUrl, supabaseAnonKey])

  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>
}
