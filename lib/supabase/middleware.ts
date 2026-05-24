import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { getSupabasePublicEnv } from '@/lib/env/supabase-public'
import type { Database } from '@/lib/supabase/database.types'

/**
 * Refreshes the auth session and forwards auth cookies + anti-cache headers on the response.
 * Call from root `middleware.ts` on every matched request.
 *
 * Uses `getClaims()` so the access token is validated / refreshed per Supabase SSR guidance.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const pair = getSupabasePublicEnv()
  if (!pair) {
    return NextResponse.next({
      request: { headers: request.headers },
    })
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient<Database>(pair.url, pair.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      },
    },
  })

  await supabase.auth.getClaims()

  return response
}
