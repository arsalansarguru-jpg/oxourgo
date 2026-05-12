import Link from 'next/link'

import { AdminOpsAlertRow } from '@/components/admin/admin-ops-alert-row'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { listOpsAlertsForAdmin } from '@/lib/admin/data/ops-alerts'
import { requireAppRole } from '@/lib/auth/server'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

export const dynamic = 'force-dynamic'

export default async function AdminNotificationsPage() {
  const { user } = await requireAppRole('ops_admin')
  let alerts: Awaited<ReturnType<typeof listOpsAlertsForAdmin>> = []
  try {
    alerts = await listOpsAlertsForAdmin(user.id, 200)
  } catch {
    alerts = []
  }

  const active = alerts.filter((a) => !a.dismissed)
  const done = alerts.filter((a) => a.dismissed)

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Operations"
        title="Alert center"
        description="Booking, KYC, and payment signals land here. Dismiss items you have triaged — other admins keep their own dismiss state."
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-soft">Active</h2>
        {active.length === 0 ? (
          <Card className={cn(cardSurfaceBase, 'border border-white/[0.08]')}>
            <CardContent className="p-6 text-sm text-muted">No active alerts.</CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {active.map((a) => (
              <AdminOpsAlertRow key={a.id} alert={a} />
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-soft">Dismissed (recent)</h2>
          <ul className="space-y-2 text-sm text-muted">
            {done.slice(0, 30).map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 border-b border-white/[0.06] py-2">
                <span className="text-soft">{a.title}</span>
                <span>{new Date(a.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-center text-sm text-muted">
        <Link href="/admin" className="text-electric hover:underline">
          ← Admin overview
        </Link>
      </p>
    </div>
  )
}
