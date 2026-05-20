import { isStaffRole } from '@/lib/auth/permissions'
import type { AppAuthRole } from '@/lib/auth/roles'
import { safeNextPath } from '@/lib/auth/safe-next-path'

/** Default landing page after sign-in by resolved app role. */
export function defaultPostLoginPath(appRole: AppAuthRole): '/admin' | '/dashboard' {
  return isStaffRole(appRole) ? '/admin' : '/dashboard'
}

/**
 * Safe internal redirect after login/OAuth — staff never land on customer dashboard.
 */
export function resolvePostLoginPath(appRole: AppAuthRole, rawNext?: string | null): string {
  const fallback = defaultPostLoginPath(appRole)
  const next = safeNextPath(rawNext, fallback)

  if (isStaffRole(appRole)) {
    const pathOnly = next.split('?')[0] ?? next
    if (pathOnly === '/dashboard' || pathOnly.startsWith('/dashboard/')) {
      return '/admin'
    }
    return next
  }

  const pathOnly = next.split('?')[0] ?? next
  if (pathOnly === '/admin' || pathOnly.startsWith('/admin/')) {
    return '/dashboard'
  }

  return next
}
