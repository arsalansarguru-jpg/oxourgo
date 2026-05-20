export {
  APP_ROLE_APP_METADATA_KEY,
  APP_AUTH_ROLES,
  ASSIGNABLE_STAFF_ROLES,
  roleAtLeast,
  roleLabel,
  parseAppAuthRole,
  normalizeAppAuthRole,
  resolveAuthRoleFromMetadata,
} from '@/lib/auth/roles'
export type { AppAuthRole, AssignableStaffRole } from '@/lib/auth/roles'
export {
  PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isStaffRole,
  isReadOnlyStaff,
  canPerformDestructiveActions,
} from '@/lib/auth/permissions'
export type { Permission } from '@/lib/auth/permissions'
export { AuthError, authErrorToUserMessage, isAuthError } from '@/lib/auth/errors'
export { canAccessAdminPath, resolveAdminRoutePermission, ADMIN_ROUTE_RULES } from '@/lib/auth/route-access'
