import 'server-only'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { authErrorToUserMessage, isAuthError } from '@/lib/auth/errors'
import { type Permission } from '@/lib/auth/permissions'
import { requirePermission, type AuthSessionSummary } from '@/lib/auth/server'
import { SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'

export type AdminPermissionGuardResult =
  | { ok: true; session: AuthSessionSummary }
  | ({ ok: false } & AdminActionResult)

export async function requirePermissionForAdminAction(
  permission: Permission,
): Promise<AdminPermissionGuardResult> {
  try {
    const session = await requirePermission(permission)
    return { ok: true, session }
  } catch (error) {
    if (isAuthError(error)) {
      return { ok: false, message: error.userMessage }
    }
    return { ok: false, message: SAFE_USER_MESSAGE.generic }
  }
}
