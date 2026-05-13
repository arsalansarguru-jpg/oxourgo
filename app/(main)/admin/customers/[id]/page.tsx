import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminCustomerOps } from '@/components/admin/admin-customer-ops'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { adminGetCustomer } from '@/lib/admin/data/customers'
import { adminListBookingsForUser } from '@/lib/admin/data/bookings'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'
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
  try {
    customer = await adminGetCustomer(id)
    if (customer) bookings = await adminListBookingsForUser(id)
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
        <Card className={cn(cardSurfaceBase, 'border border-white/[0.08]')}>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Displayed risk</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-soft">{displayRisk}</p>
            <p className="mt-1 text-xs text-muted">Max of stored profile score and cancel-rate heuristic.</p>
          </CardContent>
        </Card>
        <Card className={cn(cardSurfaceBase, 'border border-white/[0.08]')}>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Bookings</p>
            <p className="mt-2 text-2xl font-semibold text-soft">{customer.bookingCount}</p>
            <p className="mt-1 text-xs text-muted">{customer.cancelledCount} cancelled</p>
          </CardContent>
        </Card>
        <Card className={cn(cardSurfaceBase, 'border border-white/[0.08]')}>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Tier</p>
            <p className="mt-3">
              <AdminStatusPill value={customer.profile?.verification_tier ?? 'basic'} />
            </p>
          </CardContent>
        </Card>
      </div>

      <AdminCustomerOps userId={customer.userId} profile={customer.profile} />

      <Card className={cn(cardSurfaceBase, 'overflow-hidden border border-white/[0.08]')}>
        <CardContent className="p-0">
          <div className="border-b border-white/[0.08] px-5 py-4">
            <h2 className="text-lg font-semibold text-soft">Booking history</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/[0.08] bg-white/[0.03] text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Pickup</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-white/[0.05]">
                    <td className="px-4 py-3 text-soft">{vehicleLabel(b)}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(b.pickup_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusPill value={b.booking_status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-soft">{formatInr(b.total_rupees)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/bookings/${b.id}`} className="text-electric hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bookings.length === 0 ? <p className="p-6 text-sm text-muted">No bookings for this account.</p> : null}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted">
        <Link href="/admin/customers" className="text-electric hover:underline">
          ← Customers
        </Link>
      </p>
    </div>
  )
}
