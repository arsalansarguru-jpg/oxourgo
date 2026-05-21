/** Customer member hub (dashboard). */
export const CUSTOMER_HOME = '/dashboard' as const

/** Staff command center landing. */
export const ADMIN_HOME = '/admin/dashboard' as const

/** Admin console root (redirects to {@link ADMIN_HOME}). */
export const ADMIN_ROOT = '/admin' as const

export const PROTECTED_ROUTE_PREFIXES = ['/dashboard', '/admin', '/member'] as const
