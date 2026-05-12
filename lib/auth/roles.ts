/**
 * Application roles for Oxour Go (distinct from Postgres `auth.role()` / JWT `role: "authenticated"`).
 * Set on the user in `app_metadata` via Supabase Auth Hook, SQL admin, or Dashboard — never from the client alone.
 */
export const APP_ROLE_APP_METADATA_KEY = 'oxour_role' as const

export type AppAuthRole = 'customer' | 'fleet_host' | 'ops_admin' | 'super_admin'

export const APP_AUTH_ROLES: readonly AppAuthRole[] = [
  'customer',
  'fleet_host',
  'ops_admin',
  'super_admin',
] as const

const ROLE_ORDER: Record<AppAuthRole, number> = {
  customer: 0,
  fleet_host: 1,
  ops_admin: 2,
  super_admin: 3,
}

export function parseAppAuthRole(value: unknown): AppAuthRole | null {
  if (typeof value !== 'string') return null
  return (APP_AUTH_ROLES as readonly string[]).includes(value) ? (value as AppAuthRole) : null
}

/** True if `userRole` is at least `minimum` in the hierarchy (for coarse RBAC gates). */
export function roleAtLeast(userRole: AppAuthRole | null, minimum: AppAuthRole): boolean {
  if (!userRole) return false
  return ROLE_ORDER[userRole] >= ROLE_ORDER[minimum]
}
