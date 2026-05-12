import { redirect } from 'next/navigation'

import { AdminShell } from '@/components/admin/admin-shell'
import { listOpsAlertsForAdmin } from '@/lib/admin/data/ops-alerts'
import { requireAppRole } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let session: Awaited<ReturnType<typeof requireAppRole>>
  try {
    session = await requireAppRole('ops_admin')
  } catch {
    redirect('/dashboard?error=forbidden')
  }

  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())

  let opsInitialUnread = 0
  let opsInitialItems: Awaited<ReturnType<typeof listOpsAlertsForAdmin>> = []
  if (hasServiceRole) {
    try {
      const items = await listOpsAlertsForAdmin(session.user.id, 12)
      opsInitialUnread = items.filter((i) => !i.dismissed).length
      opsInitialItems = items.filter((i) => !i.dismissed).slice(0, 6)
    } catch {
      opsInitialUnread = 0
      opsInitialItems = []
    }
  }

  return (
    <AdminShell
      email={session.user.email ?? undefined}
      appRole={session.appRole}
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
