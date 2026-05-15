import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminCustomerOps } from '@/components/admin/admin-customer-ops'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { AdminAuditTimelineSection } from '@/components/admin/audit/admin-audit-timeline-section'
import { adminGetCustomer } from '@/lib/admin/data/customers'
import { adminListBookingsForUser } from '@/lib/admin/data/bookings'
import { listAuditLogsForUser } from '@/lib/admin/data/audit-logs'
import { formatInr } from '@/lib/format'

export const dynamic = 'force-dynamic'

function vehicleLabel(row: { vehicles: unknown }): string {
  const v = row.vehicles as { name?: string; brand?: string } | { name?: string; brand?: string }[] | null
  if (!v) return 'Vehicle'
  const first = Array.isArray(v) ? v[0] : v
  if (!first) return 'Vehicle'
  return (first.name?.trim() || `${first.brand ?? ''}`.trim()) || 'Vehicle'
}

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let customer: Awaited<ReturnType<typeof adminGetCustomer>> = null
  let bookings: Awaited<ReturnType<typeof adminListBookingsForUser>> = []
  let activity: Awaited<ReturnType<typeof listAuditLogsForUser>> = []
  try {
    customer = await adminGetCustomer(id)
    if (customer) {
      ;[bookings, activity] = await Promise.all([adminListBookingsForUser(id), listAuditLogsForUser(id)])
    }
  } catch {
    customer = null
  }
  if (!customer) notFound()

  const stored = customer.profile?.risk_score ?? 0
  const displayRisk = Math.max(stored, customer.heuristicRisk)

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Customer"
        title={customer.email ?? customer.userId}
        description={`Joined ${new Date(customer.createdAt).toLocaleDateString()} · Last sign-in ${customer.lastSignInAt ? new Date(customer.lastSignInAt).toLocaleString() : '—'}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminCard className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Displayed risk</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-soft">{displayRisk}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">Max of stored profile score and cancel-rate heuristic.</p>
        </AdminCard>
        <AdminCard className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Bookings</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-soft">{customer.bookingCount}</p>
          <p className="mt-2 text-xs text-muted">{customer.cancelledCount} cancelled</p>
        </AdminCard>
        <AdminCard className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Tier</p>
          <p className="mt-4">
            <AdminStatusPill value={customer.profile?.verification_tier ?? 'basic'} />
          </p>
        </AdminCard>
      </div>

      <AdminCustomerOps userId={customer.userId} profile={customer.profile} />

      <AdminAuditTimelineSection
        title="Customer activity"
        description="KYC decisions, bookings, payments, and admin actions tied to this customer."
        entries={activity}
        compact
        showEntityLinks
      />

      <AdminCard className="overflow-hidden">
        <AdminCardContent className="p-0">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">Booking history</h2>
          </div>
          <div className="overflow-x-auto scroll-touch">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-4 py-3.5 font-medium">Vehicle</th>
                  <th className="px-4 py-3.5 font-medium">Pickup</th>
                  <th className="px-4 py-3.5 font-medium">Status</th>
                  <th className="px-4 py-3.5 font-medium">Total</th>
                  <th className="px-4 py-3.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="admin-table-row">
                    <td className="px-4 py-3 text-soft">{vehicleLabel(b)}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(b.pickup_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusPill value={b.booking_status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-soft">{formatInr(b.total_rupees)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="font-medium text-electric transition-colors hover:text-electric/85"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bookings.length === 0 ? <p className="p-6 text-sm text-muted">No bookings for this account.</p> : null}
        </AdminCardContent>
      </AdminCard>

      <p className="text-center text-sm text-muted">
        <Link href="/admin/customers" className="font-medium text-electric transition-colors hover:text-electric/85">
          ← Customers
        </Link>
      </p>
    </div>
  )
}
