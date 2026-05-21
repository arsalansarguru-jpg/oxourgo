/** Temporary role-resolution logging (set OXOUR_AUTH_DEBUG=1 in any environment). */
export function isAuthRoleDebugEnabled(): boolean {
  return process.env.OXOUR_AUTH_DEBUG === '1' || process.env.NODE_ENV === 'development'
}

export function logAuthRoleDebug(context: string, details: Record<string, unknown>): void {
  if (!isAuthRoleDebugEnabled()) return
  const role = details.ResolvedRole ?? details.resolved
  if (role !== undefined) {
    console.log('Resolved Role:', role)
  }
  const session = details.Session ?? details.session
  if (session !== undefined) {
    console.log('Session:', session)
  }
  console.log(`[auth:role] ${context}`, details)
}

export function debugLogRoleResolution(
  context: string,
  details: Record<string, unknown>,
): void {
  logAuthRoleDebug(context, details)
}
