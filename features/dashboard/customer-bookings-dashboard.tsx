import { Car } from 'lucide-react'

import type { BookingWithCar } from '@/lib/supabase/database.types'
import type { ListBookingsForUserResult } from '@/lib/customer/bookings-queries'
import { deriveCustomerBookingUiStatus } from '@/lib/customer/derive-booking-ui-status'
import { CustomerBookingFleetCard } from '@/components/dashboard/customer-booking-fleet-card'
import { DataLoadErrorPanel } from '@/components/ui/data-load-error'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

function SectionBlock({
  title,
  items,
  empty,
}: {
  title: string
  items: BookingWithCar[]
  empty: string
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">{title}</h2>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stroke-strong bg-matte/[0.2] px-4 py-6 text-center text-sm text-muted">
          {empty}
        </p>
      ) : (
        <ul className="space-y-4" role="list">
          {items.map((row) => (
            <li key={row.id}>
              <CustomerBookingFleetCard row={row} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function partitionBookings(rows: BookingWithCar[]) {
  const enriched = rows.map((row) => ({ row, ui: deriveCustomerBookingUiStatus(row) }))
  const active = enriched.filter((x) => x.ui === 'active').map((x) => x.row)
  const upcoming = enriched
    .filter((x) => x.ui === 'upcoming' || x.ui === 'pending_review')
    .map((x) => x.row)
  const completed = enriched.filter((x) => x.ui === 'completed').map((x) => x.row)
  const cancelled = enriched.filter((x) => x.ui === 'cancelled').map((x) => x.row)
  return { active, upcoming, completed, cancelled }
}

export type CustomerBookingsDashboardProps = {
  result: ListBookingsForUserResult
}

export function CustomerBookingsDashboard({ result }: CustomerBookingsDashboardProps) {
  if (!result.ok) {
    return (
      <div className="space-y-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Reservations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-soft">My bookings</h1>
        </header>
        <DataLoadErrorPanel
          title="Unable to load reservations"
          description="Please refresh the page or try again shortly."
          retryTo="/dashboard/bookings"
        />
      </div>
    )
  }

  const bookings = result.data
  if (bookings.length === 0) {
    return (
      <div className="space-y-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Reservations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-soft">My bookings</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Your authenticated reservations appear here with vehicle imagery, trip dates, totals, and live status.
          </p>
        </header>
        <div className={cn(cardSurfaceBase, 'rounded-2xl border border-stroke p-6 sm:rounded-3xl')}>
          <EmptyState
            icon={Car}
            title="No bookings yet"
            description="When you reserve from the fleet, each booking syncs here with pickup and return times, pricing, and payment state."
            actionLabel="Explore fleet"
            to="/fleet"
          />
        </div>
      </div>
    )
  }

  const { active, upcoming, completed, cancelled } = partitionBookings(bookings)

  return (
    <div className="space-y-12">
      <header className="border-b border-stroke pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Reservations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-soft md:text-4xl">My bookings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {bookings.length} reservation{bookings.length === 1 ? '' : 's'} on your account — grouped by trip state.
          Vehicle imagery, hubs, totals, and booking and payment status update as your trip progresses.
        </p>
      </header>

      {/* Desktop table-style header (decorative alignment hint; cards hold real data) */}
      <div className="hidden xl:grid xl:grid-cols-[160px_1fr] xl:gap-8 xl:px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Vehicle</p>
        <div className="grid grid-cols-[1fr_auto] gap-8 pl-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Trip & hubs</p>
          <p className="text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Total & status</p>
        </div>
      </div>

      <SectionBlock title="Active" items={active} empty="No vehicles currently on hire." />
      <SectionBlock title="Upcoming & pending" items={upcoming} empty="Nothing scheduled ahead." />
      <SectionBlock title="Completed" items={completed} empty="No completed trips in history yet." />
      <SectionBlock title="Cancelled" items={cancelled} empty="No cancelled reservations." />
    </div>
  )
}
