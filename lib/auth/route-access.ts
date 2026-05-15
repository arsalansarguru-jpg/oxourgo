import { hasPermission, isStaffRole, type Permission } from '@/lib/auth/permissions'
import { parseAppAuthRole, type AppAuthRole } from '@/lib/auth/roles'

export type AdminRouteRule = {
  /** Longest-prefix wins when matching. */
  prefix: string
  permission: Permission
  /** When true, read permission alone is enough (support / lookup roles). */
  readOnly?: boolean
}

/** Ordered longest-prefix-first for `resolveAdminRoutePermission`. */
export const ADMIN_ROUTE_RULES: readonly AdminRouteRule[] = [
  { prefix: '/admin/users', permission: 'admin.users.manage' },
  { prefix: '/admin/kyc/review', permission: 'kyc.review' },
  { prefix: '/admin/kyc', permission: 'kyc.read' },
  { prefix: '/admin/fleet/new', permission: 'fleet.write' },
  { prefix: '/admin/fleet', permission: 'fleet.read' },
  { prefix: '/admin/bookings', permission: 'bookings.read' },
  { prefix: '/admin/whatsapp', permission: 'bookings.read' },
  { prefix: '/admin/customers', permission: 'customers.read' },
  { prefix: '/admin/payments', permission: 'payments.read' },
  { prefix: '/admin/financials', permission: 'deposits.read' },
  { prefix: '/admin/violations', permission: 'penalties.read' },
  { prefix: '/admin/analytics', permission: 'analytics.read' },
  { prefix: '/admin/settings', permission: 'settings.read' },
  { prefix: '/admin/notifications', permission: 'ops.alerts.read' },
  { prefix: '/admin/forbidden', permission: 'admin.access' },
  { prefix: '/admin', permission: 'admin.dashboard.read', readOnly: true },
] as const

export function resolveAdminRoutePermission(pathname: string): Permission {
  const path = pathname.split('?')[0] ?? pathname
  for (const rule of ADMIN_ROUTE_RULES) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      return rule.permission
    }
  }
  return 'admin.dashboard.read'
}

export function canAccessAdminPath(role: AppAuthRole, pathname: string): boolean {
  if (!isStaffRole(role)) return false
  const permission = resolveAdminRoutePermission(pathname)
  return hasPermission(role, permission)
}

export function appRoleFromJwtMetadata(meta: Record<string, unknown> | undefined): AppAuthRole {
  const raw =
    (typeof meta?.oxour_role === 'string' ? meta.oxour_role : undefined) ??
    (typeof meta?.role === 'string' ? meta.role : undefined)
  return parseAppAuthRole(raw) ?? 'customer'
}
