import { isStaffRole } from '@/lib/auth/permissions'
import type { AppAuthRole } from '@/lib/auth/roles'
import { ADMIN_HOME, CUSTOMER_HOME } from '@/lib/auth/routes'
import { safeNextPath } from '@/lib/auth/safe-next-path'

export type PostLoginPath = typeof ADMIN_HOME | typeof CUSTOMER_HOME

/** Default landing page after sign-in by resolved app role. */
export function defaultPostLoginPath(appRole: AppAuthRole): PostLoginPath {
  return isStaffRole(appRole) ? ADMIN_HOME : CUSTOMER_HOME
}

function isCustomerDashboardPath(pathOnly: string): boolean {
  return pathOnly === CUSTOMER_HOME || pathOnly.startsWith(`${CUSTOMER_HOME}/`)
}

function isAdminConsolePath(pathOnly: string): boolean {
  return pathOnly === '/admin' || pathOnly.startsWith('/admin/')
}

/**
 * Safe internal redirect after login/OAuth — staff never land on customer dashboard.
 */
export function resolvePostLoginPath(appRole: AppAuthRole, rawNext?: string | null): string {
  const fallback = defaultPostLoginPath(appRole)
  const next = safeNextPath(rawNext, fallback)

  if (isStaffRole(appRole)) {
    const pathOnly = next.split('?')[0] ?? next
    if (isCustomerDashboardPath(pathOnly)) {
      return ADMIN_HOME
    }
    if (pathOnly === '/admin') {
      return ADMIN_HOME
    }
    return next
  }

  const pathOnly = next.split('?')[0] ?? next
  if (isAdminConsolePath(pathOnly)) {
    return CUSTOMER_HOME
  }

  return next
}
