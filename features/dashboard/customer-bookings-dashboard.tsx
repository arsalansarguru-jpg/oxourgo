
import { Ban, CalendarClock, Car, CheckCircle2, PlayCircle } from 'lucide-react'

import type { BookingWithCar } from '@/lib/supabase/database.types'
import type { ListBookingsForUserResult } from '@/lib/customer/bookings-queries'
import { deriveCustomerBookingUiStatus } from '@/lib/customer/derive-booking-ui-status'
import { getBusinessWhatsAppUrl } from '@/lib/business-contact'
import { CustomerBookingFleetCard } from '@/components/dashboard/customer-booking-fleet-card'
import { DataLoadErrorPanel } from '@/components/ui/data-load-error'
import { EmptyState } from '@/components/ui/EmptyState'
import { KycStatusBadge } from '@/components/kyc/kyc-status-badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

function KycBookingsGate({ bookingCleared, kycStatus }: { bookingCleared: boolean; kycStatus: string }) {
  if (bookingCleared) return null
  const s = kycStatus.toLowerCase()
  return (
    <div
      className={cn(
        cardSurfaceBase,
        'rounded-2xl border border-electric/25 bg-gradient-to-br from-electric/[0.08] via-transparent to-fill-glass p-4 sm:rounded-3xl sm:p-5',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <KycStatusBadge status={kycStatus} />
          <p className="text-sm leading-relaxed text-soft">
            {s === 'rejected'
              ? 'A document was not accepted. Open KYC Center for the reviewer note, then upload replacements.'
              : s === 'pending'
                ? 'Your documents are being reviewed. Bookings unlock automatically when verification clears.'
                : 'Upload your driving license, Aadhaar or PAN, and a selfie so we can unlock reservations.'}
          </p>
          <p className="text-xs text-muted">
            Prefer WhatsApp?{' '}
            <span className="text-soft">Our concierge verifies documents on chat.</span>
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full shrink-0 touch-manipulation sm:w-auto"
          href={getBusinessWhatsAppUrl(
            'Hi Oxour Go, I need help completing identity verification for my booking.',
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          Verification on WhatsApp
        </Button>
      </div>
    </div>
  )
}

function SectionBlock({
  title,
  items,
  empty,
  emptyTitle,
  emptyIcon: EmptyIcon,
}: {
  title: string
  items: BookingWithCar[]
  empty: string
  emptyTitle: string
  emptyIcon: typeof Car
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">{title}</h2>
      {items.length === 0 ? (
        <EmptyState
          size="compact"
          icon={EmptyIcon}
          title={emptyTitle}
          description={empty}
          actionLabel="Browse fleet"
          to="/fleet"
        />
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

function duplicateTripWarningCount(rows: BookingWithCar[]): number {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const row of rows) {
    const vehicle = Array.isArray(row.vehicles) ? (row.vehicles[0] ?? null) : row.vehicles
    const reg = vehicle?.registration_number?.trim().toUpperCase()
    if (!reg) continue
    const key = `${reg}|${row.pickup_date}|${row.return_date}`
    if (seen.has(key)) dupes.add(key)
    seen.add(key)
  }
  return dupes.size
}

export type CustomerBookingsDashboardProps = {
  result: ListBookingsForUserResult
  bookingCleared: boolean
  kycStatus: string
}

export function CustomerBookingsDashboard({ result, bookingCleared, kycStatus }: CustomerBookingsDashboardProps) {
  if (!result.ok) {
    return (
      <div className="space-y-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Reservations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-soft">My bookings</h1>
        </header>
        <KycBookingsGate bookingCleared={bookingCleared} kycStatus={kycStatus} />
        <DataLoadErrorPanel
          title="Unable to load reservations"
          description="Please refresh the page or reach concierge on WhatsApp if this persists."
          retryHref={getBusinessWhatsAppUrl(
            'Hi Oxour Go, I cannot load my bookings on the website — please help.',
          )}
          retryLabel="WhatsApp concierge"
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
        <KycBookingsGate bookingCleared={bookingCleared} kycStatus={kycStatus} />
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
  const duplicateWarnings = duplicateTripWarningCount(bookings)

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

      <KycBookingsGate bookingCleared={bookingCleared} kycStatus={kycStatus} />
      {duplicateWarnings > 0 ? (
        <div className={cn(cardSurfaceBase, 'rounded-2xl border border-amber-400/25 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100')}>
          We found {duplicateWarnings} overlapping booking group{duplicateWarnings === 1 ? '' : 's'} for the same vehicle and trip window.
          Concierge has been notified to reconcile this.
        </div>
      ) : null}

      {/* Desktop table-style header (decorative alignment hint; cards hold real data) */}
      <div className="hidden xl:grid xl:grid-cols-[160px_1fr] xl:gap-8 xl:px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Vehicle</p>
        <div className="grid grid-cols-[1fr_auto] gap-8 pl-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Trip & hubs</p>
          <p className="text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Total & status</p>
        </div>
      </div>

      <SectionBlock
        title="Active"
        items={active}
        emptyTitle="No active trip"
        emptyIcon={PlayCircle}
        empty="When your pickup window begins, the vehicle on hire appears here with live trip details."
      />
      <SectionBlock
        title="Upcoming & pending"
        items={upcoming}
        emptyTitle="Nothing scheduled ahead"
        emptyIcon={CalendarClock}
        empty="Confirmed and pending reservations show here before pickup — reserve from the fleet to fill your calendar."
      />
      <SectionBlock
        title="Completed"
        items={completed}
        emptyTitle="No completed trips yet"
        emptyIcon={CheckCircle2}
        empty="Finished drives stay in your history for receipts and concierge follow-up."
      />
      <SectionBlock
        title="Cancelled"
        items={cancelled}
        emptyTitle="No cancelled reservations"
        emptyIcon={Ban}
        empty="If a booking is cancelled, it is listed here for your records."
      />
    </div>
  )
}
