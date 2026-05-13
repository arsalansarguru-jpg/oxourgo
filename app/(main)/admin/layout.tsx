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
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          <p className="font-semibold">Service role key missing</p>
          <p className="mt-2 text-amber-100/90">
            Set <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> on
            the server. Admin data and mutations use the privileged Supabase client after your JWT role is validated.
          </p>
        </div>
      ) : null}
      {children}
    </AdminShell>
  )
}
