import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { AdminCard } from '@/components/admin/admin-card'
import { AdminShell } from '@/components/admin/admin-shell'
import { listOpsAlertsForAdmin } from '@/lib/admin/data/ops-alerts'
import { getPermissionsForRole } from '@/lib/auth/permissions'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { isStaffRole } from '@/lib/auth/permissions'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const summary = await getAuthSessionSummary()
  if (!summary) {
    redirect(`/login?${new URLSearchParams({ redirect: '/admin' }).toString()}`)
  }
  if (!isStaffRole(summary.appRole)) {
    redirect('/dashboard?error=forbidden')
  }

  const permissions = [...getPermissionsForRole(summary.appRole)]

  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  if (!hasServiceRole && process.env.NODE_ENV === 'development') {
    console.warn('[admin layout] SUPABASE_SERVICE_ROLE_KEY is unset; some admin data requires server configuration.')
  }

  let opsInitialUnread = 0
  let opsInitialItems: Awaited<ReturnType<typeof listOpsAlertsForAdmin>> = []
  if (hasServiceRole && permissions.includes('ops.alerts.read')) {
    try {
      const items = await listOpsAlertsForAdmin(summary.user.id, 12)
      opsInitialUnread = items.filter((i) => !i.dismissed).length
      opsInitialItems = items.filter((i) => !i.dismissed).slice(0, 6)
    } catch {
      opsInitialUnread = 0
      opsInitialItems = []
    }
  }

  return (
    <AdminShell
      email={summary.user.email ?? undefined}
      appRole={summary.appRole}
      permissions={permissions}
      opsInitialUnread={opsInitialUnread}
      opsInitialItems={opsInitialItems}
    >
      {!hasServiceRole ? (
        <AdminCard className="border-amber-400/20 bg-gradient-to-br from-amber-500/[0.07] to-transparent p-6 sm:p-7">
          <p className="text-sm font-semibold tracking-[-0.02em] text-soft">Admin data connection incomplete</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Some lists and actions may be empty until the deployment is fully configured. If you are an operator, check
            server logs or contact your technical lead.
          </p>
        </AdminCard>
      ) : null}
      {children}
    </AdminShell>
  )
}
