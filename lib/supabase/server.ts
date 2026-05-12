import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

import { requireSupabasePublicEnv } from '@/lib/env/supabase-public'
import type { Database } from '@/lib/supabase/database.types'

/**
 * Per-request server client (Server Components, Server Actions, Route Handlers).
 * Always create a new instance — never cache across requests.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const { url, anonKey } = requireSupabasePublicEnv()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet, headers) {
        void headers
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Cookie writes can fail from static Server Components; middleware refreshes the session.
        }
      },
    },
  })
}
