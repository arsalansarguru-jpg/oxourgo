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
  admin: 'ops_admin',
  administrator: 'ops_admin',
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

const ROLE_METADATA_KEYS = [APP_ROLE_APP_METADATA_KEY, 'role'] as const

/** Supabase Auth JWT `role` claim — not an Oxour app role. */
const SUPABASE_AUTH_ROLE_VALUES = new Set(['authenticated', 'anon', 'service_role'])

function readRoleString(meta: Record<string, unknown> | null | undefined, key: string): string | undefined {
  const v = meta?.[key]
  return typeof v === 'string' && v.trim() ? v : undefined
}

function isSupabaseAuthRoleValue(raw: string): boolean {
  return SUPABASE_AUTH_ROLE_VALUES.has(raw.trim().toLowerCase())
}

/**
 * Parse roles from a Supabase JWT claims object: nested `app_metadata` / `user_metadata`
 * plus top-level `oxour_role` / `role` when the access-token hook mirrors them there.
 */
export function collectAppRolesFromJwtClaims(
  claims?: Record<string, unknown> | null,
): AppAuthRole[] {
  if (!claims) return []

  const nestedApp =
    claims.app_metadata && typeof claims.app_metadata === 'object' && !Array.isArray(claims.app_metadata)
      ? (claims.app_metadata as Record<string, unknown>)
      : undefined
  const nestedUser =
    claims.user_metadata && typeof claims.user_metadata === 'object' && !Array.isArray(claims.user_metadata)
      ? (claims.user_metadata as Record<string, unknown>)
      : undefined

  const mergedApp: Record<string, unknown> = { ...(nestedApp ?? {}) }
  for (const key of ROLE_METADATA_KEYS) {
    const top = readRoleString(claims, key)
    if (top && !readRoleString(mergedApp, key)) {
      mergedApp[key] = top
    }
  }

  return collectAppRolesFromMetadata(
    Object.keys(mergedApp).length > 0 ? mergedApp : nestedApp,
    nestedUser,
  )
}

/** Collect every parseable app role from app + user metadata (mirrors SQL jwt_oxour_app_role). */
export function collectAppRolesFromMetadata(
  appMetadata?: Record<string, unknown> | null,
  userMetadata?: Record<string, unknown> | null,
): AppAuthRole[] {
  const parsed: AppAuthRole[] = []

  for (const meta of [appMetadata, userMetadata]) {
    for (const key of ROLE_METADATA_KEYS) {
      const raw = readRoleString(meta, key)
      if (!raw || isSupabaseAuthRoleValue(raw)) continue
      const role = parseAppAuthRole(raw)
      if (role) parsed.push(role)
    }
  }

  return parsed
}

/** Highest-privilege role wins when metadata buckets disagree. */
export function pickHighestAppRole(candidates: readonly AppAuthRole[]): AppAuthRole {
  if (candidates.length === 0) return 'customer'
  return candidates.reduce((best, role) => (ROLE_ORDER[role] > ROLE_ORDER[best] ? role : best))
}

/** True when the normalized role is full admin (`ops_admin` / legacy `admin`). */
export function isAdminPortalRole(role: AppAuthRole): boolean {
  return role === 'ops_admin' || role === 'super_admin'
}

/** Portal / operations admin (`ops_admin`, legacy `super_admin`). */
export function isAdmin(role: AppAuthRole): boolean {
  return isAdminPortalRole(role)
}

/**
 * Resolve RBAC role from Supabase Auth metadata (app_metadata preferred, then user_metadata).
 * Matches middleware and server session parsing so staff grants are not missed when
 * `oxour_role` was set in the wrong bucket or under a legacy key like `admin`.
 */
export function resolveAuthRoleFromMetadata(
  appMetadata?: Record<string, unknown> | null,
  userMetadata?: Record<string, unknown> | null,
): AppAuthRole {
  return pickHighestAppRole(collectAppRolesFromMetadata(appMetadata, userMetadata))
}

export type RoleResolutionDebug = {
  appMetadata: Record<string, unknown> | null | undefined
  userMetadata: Record<string, unknown> | null | undefined
  candidates: AppAuthRole[]
  resolved: AppAuthRole
}

export function resolveAuthRoleWithDebug(
  appMetadata?: Record<string, unknown> | null,
  userMetadata?: Record<string, unknown> | null,
): RoleResolutionDebug {
  const candidates = collectAppRolesFromMetadata(appMetadata, userMetadata)
  return {
    appMetadata,
    userMetadata,
    candidates,
    resolved: pickHighestAppRole(candidates),
  }
}

export function normalizeAppAuthRole(value: string): AppAuthRole | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const aliased = LEGACY_ROLE_ALIASES[trimmed.toLowerCase()] ?? trimmed
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
