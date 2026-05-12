'use client'

import { useContext } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

import { SupabaseContext } from '@/components/providers/supabase-provider'
import type { Database } from '@/lib/supabase/database.types'

/** `null` when public Supabase env is missing or the browser client could not be created. */
export function useSupabase(): SupabaseClient<Database> | null {
  return useContext(SupabaseContext)
}
