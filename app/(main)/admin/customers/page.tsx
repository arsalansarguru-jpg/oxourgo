import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { adminListCustomers } from '@/lib/admin/data/customers'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage() {
  let rows: Awaited<ReturnType<typeof adminListCustomers>> = []
  try {
    rows = await adminListCustomers()
  } catch {
    rows = []
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Customers"
        title="Directory"
        description="Auth-backed directory with profile tier, heuristic risk from cancellations, and admin-editable fields."
      />

      <AdminCard className="overflow-hidden">
        <AdminCardContent className="p-0">
          <div className="overflow-x-auto scroll-touch">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-4 py-3.5 font-medium">Email</th>
                  <th className="px-4 py-3.5 font-medium">Tier</th>
                  <th className="px-4 py-3.5 font-medium">Risk</th>
                  <th className="px-4 py-3.5 font-medium">Bookings</th>
                  <th className="px-4 py-3.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const tier = r.profile?.verification_tier ?? 'basic'
                  const stored = r.profile?.risk_score ?? 0
                  const displayRisk = Math.max(stored, r.heuristicRisk)
                  return (
                    <tr key={r.userId} className="admin-table-row">
                      <td className="px-4 py-3 text-soft">{r.email ?? r.userId}</td>
                      <td className="px-4 py-3">
                        <AdminStatusPill value={tier} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted">
                        {displayRisk}
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-muted/80">
                          (max stored {stored}, heuristic {r.heuristicRisk})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {r.bookingCount}
                        {r.cancelledCount ? ` · ${r.cancelledCount} cancelled` : ''}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/customers/${r.userId}`}
                          className="font-medium text-electric transition-colors hover:text-electric/85"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-muted">No customers in this view. Adjust filters or try again shortly.</p>
          ) : null}
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}
