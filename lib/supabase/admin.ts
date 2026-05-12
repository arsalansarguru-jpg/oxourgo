import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import { requireSupabasePublicEnv } from '@/lib/env/supabase-public'
import type { Database } from '@/lib/supabase/database.types'

/**
 * Service-role client: bypasses RLS. Use only in trusted server code (cron, internal APIs, migrations).
 * Never import from Client Components or expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
 */
export function createAdminClient(): SupabaseClient<Database> {
  const { url } = requireSupabasePublicEnv()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!serviceRoleKey) {
    throw new Error(
      'Admin Supabase client requires SUPABASE_SERVICE_ROLE_KEY (server-only). Do not use NEXT_PUBLIC_ for this value.',
    )
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
