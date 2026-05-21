'use client'

import type { User } from '@supabase/supabase-js'

import { isAdmin, isStaffRole, resolveAuthRoleFromMetadata, type AppAuthRole } from '@/lib/auth/roles'
import { resolveAppRoleForUser } from '@/lib/auth/resolve-session-role'

/** Sync role from user metadata only (prefer {@link useResolvedAppRole} in UI). */
export function appRoleFromUser(user: User | null): AppAuthRole {
  if (!user) return 'customer'
  return resolveAuthRoleFromMetadata(
    user.app_metadata as Record<string, unknown> | undefined,
    user.user_metadata as Record<string, unknown> | undefined,
  )
}

/** Sync role from user + optional JWT claims snapshot. */
export function appRoleFromUserAndClaims(
  user: User | null,
  claims?: Record<string, unknown> | null,
  accessToken?: string | null,
): AppAuthRole {
  if (!user) return 'customer'
  return resolveAppRoleForUser(user, claims, accessToken)
}

/** @deprecated Prefer `useResolvedAppRole` for navigation after login. */
export function useAppAuthRole(user: User | null): {
  appRole: AppAuthRole
  isStaff: boolean
  isAdmin: boolean
} {
  const appRole = appRoleFromUser(user)
  return {
    appRole,
    isStaff: isStaffRole(appRole),
    isAdmin: isAdmin(appRole),
  }
}
