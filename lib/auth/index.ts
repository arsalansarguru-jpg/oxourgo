export {
  APP_ROLE_APP_METADATA_KEY,
  APP_AUTH_ROLES,
  ASSIGNABLE_STAFF_ROLES,
  roleAtLeast,
  roleLabel,
  parseAppAuthRole,
  normalizeAppAuthRole,
  resolveAuthRoleFromMetadata,
  resolveAuthRoleWithDebug,
  collectAppRolesFromMetadata,
  collectAppRolesFromJwtClaims,
  pickHighestAppRole,
  isAdminPortalRole,
  isAdmin,
} from '@/lib/auth/roles'
export { ADMIN_HOME, ADMIN_ROOT, CUSTOMER_HOME, PROTECTED_ROUTE_PREFIXES } from '@/lib/auth/routes'
export { defaultPostLoginPath, resolvePostLoginPath } from '@/lib/auth/post-login-path'
export { resolveClientAuthRole } from '@/lib/auth/resolve-client-role'
export { resolveAppRoleForUser, resolveAppRoleWithClaims } from '@/lib/auth/resolve-session-role'
export { debugLogRoleResolution, isAuthRoleDebugEnabled } from '@/lib/auth/role-debug'
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
