/**
 * Application roles for Oxour Go (distinct from Postgres `auth.role()` / JWT `role: "authenticated"`).
 * Set on the user in `app_metadata` via Supabase Auth Hook, SQL admin, or Dashboard — never from the client alone.
 */
export const APP_ROLE_APP_METADATA_KEY = 'oxour_role' as const

/** Canonical staff + customer roles. Legacy JWT values are normalized in `parseAppAuthRole`. */
export type AppAuthRole =
  | 'customer'
  | 'fleet_manager'
  | 'finance_manager'
  | 'kyc_reviewer'
  | 'support_agent'
  | 'ops_admin'
  /** @deprecated Use `fleet_manager`. Kept for existing JWTs. */
  | 'fleet_host'
  /** @deprecated Alias for `ops_admin`. Kept for existing JWTs. */
  | 'super_admin'

export const APP_AUTH_ROLES: readonly AppAuthRole[] = [
  'customer',
  'fleet_manager',
  'finance_manager',
  'kyc_reviewer',
  'support_agent',
  'ops_admin',
  'fleet_host',
  'super_admin',
] as const

/** Roles assignable via the admin user-management UI (excludes legacy aliases). */
export const ASSIGNABLE_STAFF_ROLES = [
  'ops_admin',
  'fleet_manager',
  'finance_manager',
  'kyc_reviewer',
  'support_agent',
  'customer',
] as const satisfies readonly AppAuthRole[]

export type AssignableStaffRole = (typeof ASSIGNABLE_STAFF_ROLES)[number]

const LEGACY_ROLE_ALIASES: Record<string, AppAuthRole> = {
  fleet_host: 'fleet_manager',
  super_admin: 'ops_admin',
}

const ROLE_ORDER: Record<AppAuthRole, number> = {
  customer: 0,
  support_agent: 1,
  kyc_reviewer: 2,
  fleet_manager: 3,
  fleet_host: 3,
  finance_manager: 4,
  ops_admin: 5,
  super_admin: 5,
}

export const ROLE_LABELS: Record<AppAuthRole, string> = {
  customer: 'Customer',
  fleet_manager: 'Fleet Manager',
  fleet_host: 'Fleet Manager',
  finance_manager: 'Finance Manager',
  kyc_reviewer: 'KYC Reviewer',
  support_agent: 'Support Agent',
  ops_admin: 'Operations Admin',
  super_admin: 'Operations Admin',
}

export function normalizeAppAuthRole(value: string): AppAuthRole | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const aliased = LEGACY_ROLE_ALIASES[trimmed] ?? trimmed
  return (APP_AUTH_ROLES as readonly string[]).includes(aliased) ? (aliased as AppAuthRole) : null
}

export function parseAppAuthRole(value: unknown): AppAuthRole | null {
  if (typeof value !== 'string') return null
  return normalizeAppAuthRole(value)
}

/**
 * Coarse hierarchy gate (legacy). Prefer `hasPermission` from `lib/auth/permissions.ts` for admin features.
 */
export function roleAtLeast(userRole: AppAuthRole | null, minimum: AppAuthRole): boolean {
  if (!userRole) return false
  const normalized = normalizeAppAuthRole(userRole) ?? userRole
  const minimumNorm = normalizeAppAuthRole(minimum) ?? minimum
  return ROLE_ORDER[normalized] >= ROLE_ORDER[minimumNorm]
}

export function roleLabel(role: AppAuthRole): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, ' ')
}
