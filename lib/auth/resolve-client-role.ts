'use client'

import type { SupabaseClient, User } from '@supabase/supabase-js'

import { decodeAccessTokenPayload } from '@/lib/auth/jwt-payload'
import { logAuthRoleDebug } from '@/lib/auth/role-debug'
import type { AppAuthRole } from '@/lib/auth/roles'
import { resolveAppRoleForUser } from '@/lib/auth/resolve-session-role'

export type ResolvedClientAuth = {
  user: User | null
  session: { access_token?: string } | null
  appRole: AppAuthRole
}

export type ResolveClientAuthOptions = {
  /**
   * When false (default), reads the cached session only — safe on every route change.
   * When true, calls `refreshSession()` first (use on mount / TOKEN_REFRESHED only).
   */
  refresh?: boolean
}

/**
 * Merge JWT claims + access-token payload, resolve app role (client).
 * Avoid calling `refreshSession()` on navigation — it can briefly clear the session UI.
 */
export async function resolveClientAuthRole(
  supabase: SupabaseClient,
  options: ResolveClientAuthOptions = {},
): Promise<ResolvedClientAuth> {
  if (options.refresh) {
    await supabase.auth.refreshSession()
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  let claimsRecord: Record<string, unknown> | undefined
  try {
    const { data } = await supabase.auth.getClaims()
    if (data?.claims && typeof data.claims === 'object') {
      claimsRecord = data.claims as Record<string, unknown>
    }
  } catch {
    claimsRecord = undefined
  }

  if (!claimsRecord && session?.access_token) {
    claimsRecord = decodeAccessTokenPayload(session.access_token)
  }

  const appRole = user ? resolveAppRoleForUser(user, claimsRecord) : ('customer' as AppAuthRole)

  logAuthRoleDebug('resolveClientAuthRole', {
    refresh: Boolean(options.refresh),
    ResolvedRole: appRole,
    Session: {
      userId: user?.id,
      email: user?.email,
      app_metadata: user?.app_metadata,
      user_metadata: user?.user_metadata,
    },
    jwt_claims: claimsRecord,
  })

  return { user, session, appRole }
}
