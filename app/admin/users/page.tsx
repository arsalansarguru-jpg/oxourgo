import { UsersManagementClient } from '@/features/admin/users-management-client'
import { listRecentAdminAuditForAdmin, listStaffUsersForAdmin } from '@/lib/admin/data/staff-users'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const summary = await requireAdminPageAccess('/admin/users')

  let users: Awaited<ReturnType<typeof listStaffUsersForAdmin>> = []
  let activity: Awaited<ReturnType<typeof listRecentAdminAuditForAdmin>> = []

  try {
    ;[users, activity] = await Promise.all([listStaffUsersForAdmin(120), listRecentAdminAuditForAdmin(50)])
  } catch {
    users = []
    activity = []
  }

  return (
    <UsersManagementClient
      users={users}
      activity={activity}
      actorRole={summary.appRole}
      actorId={summary.user.id}
    />
  )
}
