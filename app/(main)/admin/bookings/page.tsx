import Link from 'next/link'

import { AdminBookingsManager } from '@/components/admin/bookings/admin-bookings-manager'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { adminEnrichBookingsWithCustomerEmails, adminListBookings } from '@/lib/admin/data/bookings'
import { cn } from '@/lib/utils/cn'

export const dynamic = 'force-dynamic'

const STATUS_FILTERS = [
  { label: 'All', param: '' },
  { label: 'Pending', param: 'pending_payment' },
  { label: 'Confirmed', param: 'confirmed' },
  { label: 'Completed', param: 'completed' },
  { label: 'Cancelled', param: 'cancelled' },
] as const

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

  let rows: Awaited<ReturnType<typeof adminEnrichBookingsWithCustomerEmails>> = []
  try {
    const base = await adminListBookings(safeStatus ? { booking_status: safeStatus } : {})
    rows = await adminEnrichBookingsWithCustomerEmails(base)
  } catch {
    rows = []
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Bookings"
        title="Reservations"
        description="Search and filter live reservations, act on lifecycle transitions, and open any row for full payment and audit context."
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
                'rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-[background-color,border-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                active
                  ? 'border-electric/45 bg-electric/18 text-electric shadow-[0_0_24px_-10px_rgba(59,130,246,0.55)]'
                  : 'border-white/[0.08] bg-white/[0.03] text-muted hover:border-white/[0.12] hover:bg-white/[0.055] hover:text-soft',
              )}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <AdminBookingsManager rows={rows} />
    </div>
  )
}
