import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { requireSupabasePublicEnv } from '@/lib/env/supabase-public'
import type { Database } from '@/lib/supabase/database.types'

/**
 * Anonymous Supabase REST client for **public** reads (e.g. `public.vehicles`).
 * Does not attach cookies or refresh sessions — avoids App Router + SSR quirks
 * where `createServerClient` session handling is unnecessary for catalog data.
 *
 * Use `createClient` from `@/lib/supabase/server` when you need the user session
 * (RLS on `auth.uid()`, inserts, etc.).
 */
export function createPublicServerSupabaseClient() {
  const { url, anonKey } = requireSupabasePublicEnv()
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
