import type { SupabaseClient, User } from '@supabase/supabase-js'

import { decodeAccessTokenPayload } from '@/lib/auth/jwt-payload'
import { logAuthRoleDebug } from '@/lib/auth/role-debug'
import {
  collectAppRolesFromJwtClaims,
  pickHighestAppRole,
  resolveAuthRoleFromMetadata,
  resolveAuthRoleWithDebug,
  type AppAuthRole,
} from '@/lib/auth/roles'

/**
 * Resolve app role from Supabase user + optional JWT claims (middleware / server).
 * Merges user.app_metadata, user.user_metadata, and JWT claim mirrors when present.
 */
export function resolveAppRoleForUser(
  user: User,
  claims?: Record<string, unknown> | null,
  accessToken?: string | null,
): AppAuthRole {
  const fromUser = resolveAuthRoleFromMetadata(
    user.app_metadata as Record<string, unknown> | undefined,
    user.user_metadata as Record<string, unknown> | undefined,
  )
  const fromJwt = pickHighestAppRole(collectAppRolesFromJwtClaims(claims ?? undefined))
  const tokenCandidates = accessToken
    ? collectAppRolesFromJwtClaims(decodeAccessTokenPayload(accessToken))
    : []
  const fromToken =
    tokenCandidates.length > 0 ? pickHighestAppRole(tokenCandidates) : null
  return pickHighestAppRole([fromUser, fromJwt, ...(fromToken ? [fromToken] : [])])
}

export function resolveAppRoleForSession(
  user: User,
  claims?: Record<string, unknown> | null,
  accessToken?: string | null,
): AppAuthRole {
  return resolveAppRoleForUser(user, claims, accessToken)
}

export async function resolveAppRoleWithClaims(
  supabase: SupabaseClient,
  user: User,
  context: string,
): Promise<AppAuthRole> {
  const appMeta = user.app_metadata as Record<string, unknown> | undefined
  const userMeta = user.user_metadata as Record<string, unknown> | undefined

  let claimsRecord: Record<string, unknown> | undefined
  try {
    const { data, error } = await supabase.auth.getClaims()
    if (!error && data?.claims && typeof data.claims === 'object') {
      claimsRecord = data.claims as Record<string, unknown>
    }
  } catch {
    claimsRecord = undefined
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const accessToken = session?.access_token
  if (!claimsRecord && accessToken) {
    claimsRecord = decodeAccessTokenPayload(accessToken)
  }

  const resolved = resolveAppRoleForUser(user, claimsRecord, accessToken)
  const debug = resolveAuthRoleWithDebug(appMeta, userMeta)

  logAuthRoleDebug(context, {
    ResolvedRole: resolved,
    Session: {
      userId: user.id,
      email: user.email,
      app_metadata: appMeta,
      user_metadata: userMeta,
    },
    jwt_claims: claimsRecord,
    candidates: debug.candidates,
    resolved,
  })

  return resolved
}
