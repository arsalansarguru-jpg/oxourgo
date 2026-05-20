/** Temporary role-resolution logging (set OXOUR_AUTH_DEBUG=1 in any environment). */
export function isAuthRoleDebugEnabled(): boolean {
  return process.env.OXOUR_AUTH_DEBUG === '1' || process.env.NODE_ENV === 'development'
}

export function debugLogRoleResolution(
  context: string,
  details: Record<string, unknown>,
): void {
  if (!isAuthRoleDebugEnabled()) return
  console.log(`[auth:role] ${context}`, details)
}
