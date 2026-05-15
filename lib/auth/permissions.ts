import type { AppAuthRole } from '@/lib/auth/roles'

/**
 * Fine-grained permissions for Oxour Go admin/staff surfaces.
 * Enforced server-side via `requirePermission`; UI guards are additive only.
 */
export const PERMISSIONS = [
  'admin.access',
  'admin.dashboard.read',
  'admin.users.manage',
  'admin.audit.read',
  'admin.exports.read',
  'admin.backup.read',
  'admin.recovery.write',
  'admin.help.read',
  'admin.training.read',
  'admin.launch.read',
  'admin.launch.write',
  'fleet.read',
  'fleet.write',
  'fleet.delete',
  'bookings.read',
  'bookings.write',
  'bookings.inspect',
  'customers.read',
  'customers.write',
  'kyc.read',
  'kyc.review',
  'payments.read',
  'payments.write',
  'deposits.read',
  'deposits.write',
  'refunds.write',
  'penalties.read',
  'penalties.write',
  'analytics.read',
  'settings.read',
  'settings.write',
  'ops.alerts.read',
  'ops.alerts.write',
  'ops.override',
  'ops.manual.read',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const ALL: ReadonlySet<Permission> = new Set(PERMISSIONS)

const READ_ONLY_STAFF: readonly Permission[] = [
  'admin.access',
  'admin.dashboard.read',
  'bookings.read',
  'customers.read',
  'fleet.read',
  'kyc.read',
  'payments.read',
  'deposits.read',
  'penalties.read',
  'analytics.read',
  'ops.alerts.read',
  'ops.manual.read',
  'admin.backup.read',
  'admin.help.read',
  'admin.training.read',
]

const FLEET_MANAGER: readonly Permission[] = [
  ...READ_ONLY_STAFF.filter((p) => p !== 'payments.read' && p !== 'deposits.read' && p !== 'penalties.read'),
  'fleet.write',
  'fleet.delete',
  'admin.exports.read',
  'admin.backup.read',
  'admin.recovery.write',
  'bookings.write',
  'bookings.inspect',
  'customers.read',
  'ops.alerts.write',
  'ops.manual.read',
]

const FINANCE_MANAGER: readonly Permission[] = [
  'admin.access',
  'admin.dashboard.read',
  'bookings.read',
  'customers.read',
  'payments.read',
  'payments.write',
  'deposits.read',
  'deposits.write',
  'refunds.write',
  'penalties.read',
  'penalties.write',
  'analytics.read',
  'fleet.read',
  'ops.manual.read',
  'admin.exports.read',
  'admin.backup.read',
  'admin.help.read',
  'admin.training.read',
]

const KYC_REVIEWER: readonly Permission[] = [
  'admin.access',
  'admin.dashboard.read',
  'admin.help.read',
  'admin.training.read',
  'kyc.read',
  'kyc.review',
  'customers.read',
]

const ROLE_PERMISSIONS: Record<AppAuthRole, ReadonlySet<Permission>> = {
  customer: new Set(),
  fleet_host: new Set(FLEET_MANAGER),
  fleet_manager: new Set(FLEET_MANAGER),
  finance_manager: new Set(FINANCE_MANAGER),
  kyc_reviewer: new Set(KYC_REVIEWER),
  support_agent: new Set(READ_ONLY_STAFF),
  ops_admin: ALL,
  super_admin: ALL,
}

/** Roles that may bypass lifecycle guards (force confirm, emergency cancel, hold). */
export function canUseOpsOverride(role: AppAuthRole): boolean {
  return hasPermission(role, 'ops.override')
}

export function getPermissionsForRole(role: AppAuthRole): ReadonlySet<Permission> {
  return ROLE_PERMISSIONS[role] ?? new Set()
}

export function hasPermission(role: AppAuthRole, permission: Permission): boolean {
  return getPermissionsForRole(role).has(permission)
}

export function hasAnyPermission(role: AppAuthRole, permissions: readonly Permission[]): boolean {
  const set = getPermissionsForRole(role)
  return permissions.some((p) => set.has(p))
}

export function hasAllPermissions(role: AppAuthRole, permissions: readonly Permission[]): boolean {
  const set = getPermissionsForRole(role)
  return permissions.every((p) => set.has(p))
}

/** Staff roles that may enter `/admin` (excludes pure customers). */
export function isStaffRole(role: AppAuthRole): boolean {
  return role !== 'customer' && getPermissionsForRole(role).has('admin.access')
}

export function isReadOnlyStaff(role: AppAuthRole): boolean {
  return role === 'support_agent'
}

export function canPerformDestructiveActions(role: AppAuthRole): boolean {
  if (role === 'support_agent' || role === 'kyc_reviewer') return false
  if (role === 'finance_manager') return hasPermission(role, 'payments.write')
  return hasPermission(role, 'bookings.write') || hasPermission(role, 'fleet.write')
}
