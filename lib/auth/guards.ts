import 'server-only'

import { redirect } from 'next/navigation'

import { canAccessAdminPath, resolveAdminRoutePermission } from '@/lib/auth/route-access'
import { hasPermission, type Permission } from '@/lib/auth/permissions'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { isStaffRole } from '@/lib/auth/permissions'

/**
 * Server Component / page guard: ensures staff session and route permission.
 * Redirects to login, customer dashboard, or admin forbidden — never throws raw auth errors.
 */
export async function requireAdminPageAccess(pathname: string) {
  const summary = await getAuthSessionSummary()
  if (!summary) {
    redirect(`/login?${new URLSearchParams({ redirect: pathname }).toString()}`)
  }
  if (!isStaffRole(summary.appRole)) {
    redirect('/dashboard?error=forbidden')
  }
  if (!canAccessAdminPath(summary.appRole, pathname)) {
    redirect(`/admin/forbidden?from=${encodeURIComponent(pathname)}`)
  }
  return summary
}

export async function requireAdminPermission(permission: Permission) {
  const summary = await getAuthSessionSummary()
  if (!summary) {
    redirect('/login?redirect=/admin')
  }
  if (!hasPermission(summary.appRole, permission)) {
    redirect(`/admin/forbidden?from=${encodeURIComponent(resolveAdminRoutePermission('/admin'))}`)
  }
  return summary
}
