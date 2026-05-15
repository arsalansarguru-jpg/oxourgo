'use client'

import type { ReactNode } from 'react'

import { PermissionDenied } from '@/components/auth/permission-denied'
import type { Permission } from '@/lib/auth/permissions'
import { hasPermission } from '@/lib/auth/permissions'
import type { AppAuthRole } from '@/lib/auth/roles'

export type PermissionGuardProps = {
  /** Current user role from server — never trust client-derived roles. */
  appRole: AppAuthRole
  permission: Permission
  /** Optional: require all listed permissions */
  allOf?: readonly Permission[]
  children: ReactNode
  fallback?: ReactNode
  hideOnly?: boolean
}

/**
 * Client-side UI guard. Server actions and RLS must enforce the same permission.
 */
export function PermissionGuard({
  appRole,
  permission,
  allOf,
  children,
  fallback,
  hideOnly = false,
}: PermissionGuardProps) {
  const allowed =
    hasPermission(appRole, permission) &&
    (allOf == null || allOf.every((p) => hasPermission(appRole, p)))

  if (allowed) return <>{children}</>

  if (hideOnly) return null
  if (fallback) return <>{fallback}</>

  return <PermissionDenied appRole={appRole} />
}
