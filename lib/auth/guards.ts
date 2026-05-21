import 'server-only'

import { redirect } from 'next/navigation'

import { canAccessAdminPath, resolveAdminRoutePermission } from '@/lib/auth/route-access'
import { hasPermission, type Permission } from '@/lib/auth/permissions'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { isStaffRole } from '@/lib/auth/permissions'
import { ADMIN_HOME, ADMIN_ROOT } from '@/lib/auth/routes'

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
    const base = pathname.split('?')[0] ?? pathname
    // Admin layout renders AdminNoAccessView for non-staff. Redirect only off the hub
    // to avoid a redirect loop on `/admin` while still blocking deeper admin pages.
    if (base !== ADMIN_ROOT && base !== `${ADMIN_ROOT}/` && base !== ADMIN_HOME) {
      redirect(ADMIN_ROOT)
    }
    return summary
  }
  if (!canAccessAdminPath(summary.appRole, pathname)) {
    redirect(`/admin/forbidden?from=${encodeURIComponent(pathname)}`)
  }
  return summary
}

export async function requireAdminPermission(permission: Permission) {
  const summary = await getAuthSessionSummary()
  if (!summary) {
    redirect(`/login?redirect=${encodeURIComponent(ADMIN_HOME)}`)
  }
  if (!hasPermission(summary.appRole, permission)) {
    redirect(`/admin/forbidden?from=${encodeURIComponent(resolveAdminRoutePermission('/admin'))}`)
  }
  return summary
}
