import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { adminListBookings } from '@/lib/admin/data/bookings'
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

export default async function AdminBookingsPage() {
  let rows: Awaited<ReturnType<typeof adminListBookings>> = []
  try {
    rows = await adminListBookings()
  } catch {
    rows = []
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Bookings"
        title="Reservations"
        description="Approve pending requests, adjust lifecycle and payment states, and deep-link into operations."
      />

      <Card className={cn(cardSurfaceBase, 'overflow-hidden border border-white/[0.08]')}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/[0.08] bg-white/[0.03] text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Pickup</th>
                  <th className="px-4 py-3 font-medium">Booking</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-soft">{vehicleLabel(b)}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(b.pickup_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusPill value={b.booking_status} />
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusPill value={b.payment_status} />
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
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-muted">No bookings loaded — check service role key.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
