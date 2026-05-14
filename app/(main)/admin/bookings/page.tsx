import Link from 'next/link'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { adminListBookings } from '@/lib/admin/data/bookings'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'
import { formatInr } from '@/lib/format'

export const dynamic = 'force-dynamic'

const STATUS_FILTERS = [
  { label: 'All', param: '' },
  { label: 'Pending', param: 'pending_payment' },
  { label: 'Confirmed', param: 'confirmed' },
  { label: 'Completed', param: 'completed' },
  { label: 'Cancelled', param: 'cancelled' },
] as const

function vehicleLabel(row: { vehicles: unknown }): string {
  const v = row.vehicles as { name?: string; brand?: string } | { name?: string; brand?: string }[] | null
  if (!v) return 'Vehicle'
  const first = Array.isArray(v) ? v[0] : v
  if (!first) return 'Vehicle'
  return (first.name?.trim() || `${first.brand ?? ''}`.trim()) || 'Vehicle'
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const q = await searchParams
  const raw = typeof q.status === 'string' ? q.status.trim() : ''
  const status = raw || undefined
  const allowed = !status || STATUS_FILTERS.some((f) => f.param === status)
  const safeStatus = allowed && status ? status : undefined

  let rows: Awaited<ReturnType<typeof adminListBookings>> = []
  try {
    rows = await adminListBookings(safeStatus ? { booking_status: safeStatus } : {})
  } catch {
    rows = []
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Bookings"
        title="Reservations"
        description="Filter by lifecycle, open a row for payment and status controls, and sync with customer dashboards."
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const href = f.param ? `/admin/bookings?status=${encodeURIComponent(f.param)}` : '/admin/bookings'
          const active = (safeStatus ?? '') === (f.param || '')
          return (
            <Link
              key={f.label}
              href={href}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                active
                  ? 'border-electric/50 bg-electric/15 text-electric'
                  : 'border-stroke bg-fill-glass text-muted hover:border-stroke-strong hover:text-soft',
              )}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <Card className={cn(cardSurfaceBase, 'overflow-hidden border border-stroke')}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-stroke bg-fill-glass text-xs uppercase tracking-wide text-muted">
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
                  <tr key={b.id} className="border-b border-stroke hover:bg-fill-glass">
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
            <p className="p-6 text-sm text-muted">No bookings in this view. Adjust filters or try again shortly.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
