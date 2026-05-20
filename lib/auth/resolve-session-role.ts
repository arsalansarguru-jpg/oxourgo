import type { SupabaseClient, User } from '@supabase/supabase-js'

import { debugLogRoleResolution } from '@/lib/auth/role-debug'
import {
  pickHighestAppRole,
  resolveAuthRoleFromMetadata,
  resolveAuthRoleWithDebug,
  type AppAuthRole,
} from '@/lib/auth/roles'

function metadataFromClaims(claims: Record<string, unknown> | null | undefined): {
  appMetadata?: Record<string, unknown>
  userMetadata?: Record<string, unknown>
} {
  if (!claims) return {}
  const appMetadata = claims.app_metadata
  const userMetadata = claims.user_metadata
  return {
    appMetadata:
      appMetadata && typeof appMetadata === 'object' && !Array.isArray(appMetadata)
        ? (appMetadata as Record<string, unknown>)
        : undefined,
    userMetadata:
      userMetadata && typeof userMetadata === 'object' && !Array.isArray(userMetadata)
        ? (userMetadata as Record<string, unknown>)
        : undefined,
  }
}

/**
 * Resolve app role from Supabase user + optional JWT claims (middleware / server).
 * Merges user.app_metadata, user.user_metadata, and JWT claim mirrors when present.
 */
export function resolveAppRoleForUser(
  user: User,
  claims?: Record<string, unknown> | null,
): AppAuthRole {
  const fromUser = resolveAuthRoleFromMetadata(
    user.app_metadata as Record<string, unknown> | undefined,
    user.user_metadata as Record<string, unknown> | undefined,
  )
  const fromClaims = metadataFromClaims(claims ?? undefined)
  const fromJwt = resolveAuthRoleFromMetadata(fromClaims.appMetadata, fromClaims.userMetadata)
  return pickHighestAppRole([fromUser, fromJwt])
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

  const resolved = resolveAppRoleForUser(user, claimsRecord)
  const debug = resolveAuthRoleWithDebug(appMeta, userMeta)

  debugLogRoleResolution(context, {
    userId: user.id,
    email: user.email,
    app_metadata: appMeta,
    user_metadata: userMeta,
    jwt_claims: claimsRecord,
    candidates: debug.candidates,
    resolved,
  })

  return resolved
}
