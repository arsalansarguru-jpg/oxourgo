/** Temporary admin query logging — set OXOUR_ADMIN_DATA_DEBUG=1 (server only). */
export function isAdminDataDebugEnabled(): boolean {
  return process.env.OXOUR_ADMIN_DATA_DEBUG === '1'
}

export function logAdminQueryResult(
  context: string,
  result: {
    rowCount?: number
    totalCount?: number
    error?: { message?: string; code?: string; details?: string } | null
    meta?: Record<string, unknown>
  },
): void {
  if (!isAdminDataDebugEnabled()) return
  console.log('[admin:query]', context, {
    rowCount: result.rowCount,
    totalCount: result.totalCount,
    error: result.error
      ? { message: result.error.message, code: result.error.code, details: result.error.details }
      : null,
    ...result.meta,
  })
}
