import type { BookingWithCar } from '@/lib/supabase/database.types'
import { deriveCustomerBookingUiStatus, type CustomerBookingUiStatus } from '@/lib/customer/derive-booking-ui-status'
import { CustomerBookingCard } from '@/components/dashboard/customer-booking-card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Car as CarIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

function carLabel(row: BookingWithCar): string {
  const c = row.cars
  if (!c) return 'Vehicle'
  const car = Array.isArray(c) ? c[0] : c
  if (!car) return 'Vehicle'
  return `${car.brand} ${car.model}`.trim()
}

function SectionBlock({
  title,
  items,
  empty,
}: {
  title: string
  items: { row: BookingWithCar; ui: CustomerBookingUiStatus }[]
  empty: string
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <div className="space-y-3">
          {items.map(({ row, ui }) => (
            <CustomerBookingCard
              key={row.id}
              bookingId={row.id}
              carLabel={carLabel(row)}
              uiStatus={ui}
              pickupAt={row.pickup_at}
              returnAt={row.return_at}
              pickupLocation={row.pickup_location}
              returnLocation={row.return_location}
              totalRupees={row.total_rupees}
              paymentStatus={row.payment_status}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function CustomerBookingsList({ bookings }: { bookings: BookingWithCar[] }) {
  const enriched = bookings.map((row) => ({ row, ui: deriveCustomerBookingUiStatus(row) }))
  const active = enriched.filter((x) => x.ui === 'active')
  const upcoming = enriched.filter((x) => x.ui === 'upcoming' || x.ui === 'pending_review')
  const completed = enriched.filter((x) => x.ui === 'completed')
  const cancelled = enriched.filter((x) => x.ui === 'cancelled')

  if (bookings.length === 0) {
    return (
      <div className={cn(cardSurfaceBase, 'rounded-2xl border border-white/[0.08] p-6 sm:rounded-3xl')}>
        <EmptyState
          icon={CarIcon}
          title="No bookings yet"
          description="Your reservations from Supabase will appear here with live status and payment state."
          actionLabel="Explore fleet"
          to="/fleet"
        />
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Reservations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-soft">My bookings</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Segmented by trip state — sourced from your authenticated Supabase account.
        </p>
      </header>

      <SectionBlock title="Active" items={active} empty="No vehicles currently on hire." />
      <SectionBlock title="Upcoming & pending" items={upcoming} empty="Nothing scheduled ahead." />
      <SectionBlock title="Completed" items={completed} empty="No completed trips in history yet." />
      <SectionBlock title="Cancelled" items={cancelled} empty="No cancelled reservations." />
    </div>
  )
}
