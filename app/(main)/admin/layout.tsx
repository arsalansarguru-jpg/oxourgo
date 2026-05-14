import { redirect } from 'next/navigation'

import { AdminShell } from '@/components/admin/admin-shell'
import { listOpsAlertsForAdmin } from '@/lib/admin/data/ops-alerts'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { roleAtLeast } from '@/lib/auth/roles'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const summary = await getAuthSessionSummary()
  if (!summary) {
    redirect(`/login?${new URLSearchParams({ redirect: '/admin' }).toString()}`)
  }
  if (!roleAtLeast(summary.appRole, 'ops_admin')) {
    redirect('/dashboard?error=forbidden')
  }

  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  if (!hasServiceRole) {
    console.error('[admin layout] Privileged server access is not configured; admin data may be incomplete.')
  }

  let opsInitialUnread = 0
  let opsInitialItems: Awaited<ReturnType<typeof listOpsAlertsForAdmin>> = []
  if (hasServiceRole) {
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
      opsInitialUnread={opsInitialUnread}
      opsInitialItems={opsInitialItems}
    >
      {!hasServiceRole ? (
        <div className="rounded-2xl border border-stroke bg-fill-glass p-5 text-sm text-muted shadow-[var(--shadow-card)] sm:p-6">
          <p className="font-semibold text-soft">Admin data connection incomplete</p>
          <p className="mt-2 leading-relaxed text-muted">
            Some lists and actions may be empty until the deployment is fully configured. If you are an operator, check
            server logs or contact your technical lead.
          </p>
        </div>
      ) : null}
      {children}
    </AdminShell>
  )
}
