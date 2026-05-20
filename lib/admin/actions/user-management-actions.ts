'use server'

import { revalidatePath } from 'next/cache'

import { writeAdminAudit } from '@/lib/admin/audit'
import type { AdminActionResult } from '@/lib/admin/actions/types'
import { requirePermissionForAdminAction } from '@/lib/auth/admin-action-auth'
import {
  APP_ROLE_APP_METADATA_KEY,
  ASSIGNABLE_STAFF_ROLES,
  parseAppAuthRole,
  resolveAuthRoleFromMetadata,
  type AppAuthRole,
} from '@/lib/auth/roles'
import { createAdminClient } from '@/lib/supabase/admin'
import { SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'

export async function adminAssignUserRoleAction(input: {
  userId: string
  role: AppAuthRole
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminAssignUserRoleAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('admin.users.manage')
    if (!guard.ok) return guard

    const userId = input.userId.trim()
    if (!userId) return { ok: false, message: 'User is required.' }

    const role = parseAppAuthRole(input.role)
    if (!role || !(ASSIGNABLE_STAFF_ROLES as readonly string[]).includes(role)) {
      return { ok: false, message: 'Invalid role selected.' }
    }

    if (userId === guard.session.user.id && role === 'customer') {
      return { ok: false, message: 'You cannot remove your own staff access.' }
    }

    const admin = createAdminClient()
    const { data: target, error: fetchErr } = await admin.auth.admin.getUserById(userId)
    if (fetchErr || !target.user) {
      return { ok: false, message: 'User not found.' }
    }

    const prior = resolveAuthRoleFromMetadata(
      target.user.app_metadata as Record<string, unknown> | undefined,
      target.user.user_metadata as Record<string, unknown> | undefined,
    )

    const { error } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...target.user.app_metadata,
        [APP_ROLE_APP_METADATA_KEY]: role,
      },
    })
    if (error) {
      return { ok: false, message: SAFE_USER_MESSAGE.generic }
    }

    await writeAdminAudit({
      actorUserId: guard.session.user.id,
      action: 'users.role_assign',
      entityType: 'user',
      entityId: userId,
      payload: { prior_role: prior, new_role: role },
    })

    revalidatePath('/admin/users')
    return { ok: true }
  })
}

export async function adminRefreshUserSessionsAction(userId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminRefreshUserSessionsAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('admin.users.manage')
    if (!guard.ok) return guard

    const id = userId.trim()
    if (!id) return { ok: false, message: 'User is required.' }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.signOut(id, 'global')
    if (error) {
      return { ok: false, message: SAFE_USER_MESSAGE.generic }
    }

    await writeAdminAudit({
      actorUserId: guard.session.user.id,
      action: 'users.sessions_revoke',
      entityType: 'user',
      entityId: id,
    })

    return { ok: true }
  })
}
