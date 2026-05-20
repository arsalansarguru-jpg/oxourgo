import { hasPermission, isStaffRole, type Permission } from '@/lib/auth/permissions'
import { resolveAuthRoleFromMetadata, type AppAuthRole } from '@/lib/auth/roles'

export type AdminRouteRule = {
  /** Longest-prefix wins when matching. */
  prefix: string
  permission: Permission
  /** When true, read permission alone is enough (support / lookup roles). */
  readOnly?: boolean
}

/** Ordered longest-prefix-first for `resolveAdminRoutePermission`. */
export const ADMIN_ROUTE_RULES: readonly AdminRouteRule[] = [
  { prefix: '/admin/audit', permission: 'admin.audit.read' },
  { prefix: '/admin/help/onboarding', permission: 'admin.help.read' },
  { prefix: '/admin/help', permission: 'admin.help.read' },
  { prefix: '/admin/training/onboarding', permission: 'admin.training.read' },
  { prefix: '/admin/training/guides', permission: 'admin.training.read' },
  { prefix: '/admin/training', permission: 'admin.training.read' },
  { prefix: '/admin/launch', permission: 'admin.launch.read' },
  { prefix: '/admin/backup', permission: 'admin.backup.read' },
  { prefix: '/admin/users', permission: 'admin.users.manage' },
  { prefix: '/admin/kyc/review', permission: 'kyc.review' },
  { prefix: '/admin/kyc', permission: 'kyc.read' },
  { prefix: '/admin/fleet/new', permission: 'fleet.write' },
  { prefix: '/admin/fleet', permission: 'fleet.read' },
  { prefix: '/admin/operations', permission: 'ops.manual.read' },
  { prefix: '/admin/bookings', permission: 'bookings.read' },
  { prefix: '/admin/whatsapp', permission: 'bookings.read' },
  { prefix: '/admin/customers', permission: 'customers.read' },
  { prefix: '/admin/payments', permission: 'payments.read' },
  { prefix: '/admin/financials', permission: 'deposits.read' },
  { prefix: '/admin/violations', permission: 'penalties.read' },
  { prefix: '/admin/tracking', permission: 'tracking.read' },
  { prefix: '/admin/damage', permission: 'damage.read' },
  { prefix: '/admin/traffic', permission: 'traffic.read' },
  { prefix: '/admin/support', permission: 'support.read' },
  { prefix: '/admin/analytics', permission: 'analytics.read' },
  { prefix: '/admin/settings', permission: 'settings.read' },
  { prefix: '/admin/notifications', permission: 'ops.alerts.read' },
  { prefix: '/admin/forbidden', permission: 'admin.access' },
  { prefix: '/admin/dashboard', permission: 'admin.dashboard.read', readOnly: true },
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

export function appRoleFromJwtMetadata(
  appMetadata: Record<string, unknown> | undefined,
  userMetadata?: Record<string, unknown> | undefined,
): AppAuthRole {
  return resolveAuthRoleFromMetadata(appMetadata, userMetadata)
}
