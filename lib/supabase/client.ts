import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

/** Browser Supabase client (URL + anon key come from the server layout so `.env.local` is always current). */
export function createBrowserSupabaseClient(url: string, anonKey: string): SupabaseClient<Database> {
  return createBrowserClient<Database>(url, anonKey)
}
