import 'server-only'

import type { User } from '@supabase/supabase-js'

import {
  APP_ROLE_APP_METADATA_KEY,
  type AppAuthRole,
  parseAppAuthRole,
  roleAtLeast,
} from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

export type AuthSessionSummary = {
  user: User
  /** Application RBAC role; defaults to `customer` when `app_metadata` is unset */
  appRole: AppAuthRole
}

/**
 * Verified user from Supabase Auth (network validation). Prefer over `getSession()` on the server.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

/**
 * User plus parsed `app_metadata` role for route guards and data scoping.
 */
export async function getAuthSessionSummary(): Promise<AuthSessionSummary | null> {
  const user = await getAuthenticatedUser()
  if (!user) return null

  const raw =
    user.app_metadata?.[APP_ROLE_APP_METADATA_KEY] ??
    (typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : undefined)

  return { user, appRole: parseAppAuthRole(raw) ?? 'customer' }
}

/**
 * JWT claims validated locally (or via Auth) — suitable for deriving roles from custom access token hooks.
 */
export async function getVerifiedAuthClaims() {
  const supabase = await createClient()
  return supabase.auth.getClaims()
}

export async function requireAuthenticatedUser(): Promise<User> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireAppRole(minimum: AppAuthRole): Promise<AuthSessionSummary> {
  const summary = await getAuthSessionSummary()
  if (!summary) {
    throw new Error('Unauthorized')
  }
  if (!roleAtLeast(summary.appRole, minimum)) {
    throw new Error('Forbidden')
  }
  return summary
}
