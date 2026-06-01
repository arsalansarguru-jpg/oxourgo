'use client'

import { useMemo, useState, useTransition } from 'react'
import { Activity, RefreshCw, Shield } from 'lucide-react'

import { RoleBadge } from '@/components/auth/role-badge'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { PermissionGuard } from '@/components/auth/permission-guard'
import { AdminConfirmDialog } from '@/components/admin/operations/admin-confirm-dialog'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import {
  adminAssignUserRoleAction,
  adminRefreshUserSessionsAction,
} from '@/lib/admin/actions/user-management-actions'
import type { AdminAuditActivityRow, StaffUserRow } from '@/lib/admin/data/staff-users'
import { ASSIGNABLE_STAFF_ROLES, roleLabel, type AppAuthRole } from '@/lib/auth/roles'

export type UsersManagementClientProps = {
  users: StaffUserRow[]
  activity: AdminAuditActivityRow[]
  actorRole: AppAuthRole
  actorId: string
}

export function UsersManagementClient({ users, activity, actorRole, actorId }: UsersManagementClientProps) {
  const [rows, setRows] = useState(users)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; email: string | null } | null>(null)

  const roleOptions = useMemo(
    () =>
      ASSIGNABLE_STAFF_ROLES.map((r) => ({
        value: r,
        label: roleLabel(r),
      })),
    [],
  )

  const onAssign = (userId: string, role: AppAuthRole) => {
    setMessage(null)
    startTransition(async () => {
      const result = await adminAssignUserRoleAction({ userId, role })
      if (!result.ok) {
        setMessage(result.message)
        return
      }
      setRows((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, appRole: role, roleLabel: roleLabel(role) } : u)),
      )
      setMessage('Role updated. The user may need to sign in again for JWT changes to apply.')
    })
  }

  const onRevokeSessions = (userId: string) => {
    setMessage(null)
    startTransition(async () => {
      const result = await adminRefreshUserSessionsAction(userId)
      setMessage(result.ok ? 'Sessions revoked for that user.' : result.message)
      setRevokeTarget(null)
    })
  }

  return (
    <PermissionGuard appRole={actorRole} permission="admin.users.manage">
      <div className="space-y-8">
        <AdminPageHeader
          eyebrow="Access control"
          title="User management"
          description="Assign staff roles via secure server actions. Roles are stored in Supabase Auth app_metadata and enforced in middleware, server actions, and RLS."
        />

        {message ? (
          <p className="rounded-2xl border border-electric/25 bg-electric/10 px-4 py-3 text-sm text-soft" role="status">
            {message}
          </p>
        ) : null}

        <AdminConfirmDialog
          open={revokeTarget != null}
          onClose={() => setRevokeTarget(null)}
          pending={pending}
          title="Revoke staff sessions?"
          description={
            revokeTarget
              ? `This signs ${revokeTarget.email ?? 'this user'} out on every device immediately. They must sign in again to access the admin console.`
              : ''
          }
          confirmLabel="Revoke sessions"
          onConfirm={() => {
            if (revokeTarget) onRevokeSessions(revokeTarget.id)
          }}
        />

        <AdminCard className="overflow-hidden">
          <AdminCardContent className="p-0">
            <div className="overflow-x-auto scroll-touch">
              <table className="w-full min-w-[1040px] table-fixed text-left text-sm">
                <thead className="admin-table-head">
                  <tr>
                    <th className="w-[28%] px-4 py-3.5 font-medium">Email</th>
                    <th className="w-[14%] px-4 py-3.5 font-medium">Role</th>
                    <th className="w-[18%] px-4 py-3.5 font-medium">Last sign-in</th>
                    <th className="w-[22%] px-4 py-3.5 font-medium">Assign role</th>
                    <th className="w-[18%] px-4 py-3.5 font-medium text-right">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id} className="border-t border-white/[0.06]">
                      <td className="px-4 py-3.5 text-soft">{u.email ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        <RoleBadge role={u.appRole} />
                      </td>
                      <td className="px-4 py-3.5 text-muted">
                        {u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <Select
                          value={u.appRole}
                          disabled={pending || u.id === actorId}
                          onChange={(e) => onAssign(u.id, e.target.value as AppAuthRole)}
                          aria-label={`Role for ${u.email ?? u.id}`}
                          className="min-w-[11rem]"
                        >
                          {roleOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          title="Revoke all sessions for this staff member"
                          onClick={() => setRevokeTarget({ id: u.id, email: u.email })}
                          className="inline-flex w-full max-w-[11rem] items-center justify-end gap-1.5 whitespace-nowrap"
                        >
                          <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                          Revoke sessions
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-electric" aria-hidden />
              <h2 className="text-base font-semibold tracking-[-0.02em] text-soft">Recent admin activity</h2>
            </div>
            <p className="text-sm text-muted">Immutable audit trail from privileged operations (service role).</p>
            <ul className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06]">
              {activity.length === 0 ? (
                <li className="px-4 py-6 text-sm text-muted">No audit events yet.</li>
              ) : (
                activity.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                    <Shield className="h-4 w-4 shrink-0 text-silver" aria-hidden />
                    <span className="font-medium text-soft">{a.action}</span>
                    <span className="text-muted">
                      {a.entityType}
                      {a.entityId ? ` · ${a.entityId.slice(0, 8)}…` : ''}
                    </span>
                    <span className="ml-auto text-xs text-muted">{new Date(a.createdAt).toLocaleString()}</span>
                  </li>
                ))
              )}
            </ul>
          </AdminCardContent>
        </AdminCard>
      </div>
    </PermissionGuard>
  )
}
