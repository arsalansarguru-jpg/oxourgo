'use client'

import { useMemo } from 'react'
import type { User } from '@supabase/supabase-js'

import { isStaffRole } from '@/lib/auth/permissions'
import { resolveAuthRoleFromMetadata, type AppAuthRole } from '@/lib/auth/roles'

export function appRoleFromUser(user: User | null): AppAuthRole {
  if (!user) return 'customer'
  return resolveAuthRoleFromMetadata(
    user.app_metadata as Record<string, unknown> | undefined,
    user.user_metadata as Record<string, unknown> | undefined,
  )
}

/** Client-side RBAC role from Supabase session (matches middleware / server guards). */
export function useAppAuthRole(user: User | null): { appRole: AppAuthRole; isStaff: boolean } {
  return useMemo(() => {
    const appRole = appRoleFromUser(user)
    return { appRole, isStaff: isStaffRole(appRole) }
  }, [user])
}
