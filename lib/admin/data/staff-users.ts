import 'server-only'

import { APP_ROLE_APP_METADATA_KEY, parseAppAuthRole, roleLabel, type AppAuthRole } from '@/lib/auth/roles'
import { createAdminClient } from '@/lib/supabase/admin'

export type StaffUserRow = {
  id: string
  email: string | null
  createdAt: string | null
  lastSignInAt: string | null
  appRole: AppAuthRole
  roleLabel: string
}

export type AdminAuditActivityRow = {
  id: string
  actorUserId: string
  action: string
  entityType: string
  entityId: string | null
  createdAt: string
}

export async function listStaffUsersForAdmin(limit = 100): Promise<StaffUserRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: limit })
  if (error) throw error

  return (data.users ?? []).map((u) => {
    const raw =
      u.app_metadata?.[APP_ROLE_APP_METADATA_KEY] ??
      (typeof u.app_metadata?.role === 'string' ? u.app_metadata.role : undefined)
    const appRole = parseAppAuthRole(raw) ?? 'customer'
    return {
      id: u.id,
      email: u.email ?? null,
      createdAt: u.created_at ?? null,
      lastSignInAt: u.last_sign_in_at ?? null,
      appRole,
      roleLabel: roleLabel(appRole),
    }
  })
}

export async function listRecentAdminAuditForAdmin(limit = 40): Promise<AdminAuditActivityRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('admin_audit_events')
    .select('id, actor_user_id, action, entity_type, entity_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
  }))
}
