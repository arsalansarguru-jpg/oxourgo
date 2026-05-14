import type { BookingWithCar } from '@/lib/supabase/database.types'
import type { PaymentEventRow } from '@/lib/customer/payment-queries'
import { formatBookingVehicleTitle } from '@/lib/customer/booking-display'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cardSurfaceBase, cardSurfaceHover, cardSurfaceTransition } from '@/components/ui/card-tokens'

export function CustomerPaymentsView({
  bookings,
  events,
}: {
  bookings: BookingWithCar[]
  events: PaymentEventRow[]
}) {
  return (
    <div className="space-y-10">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Ledger</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-soft">Payments</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Rental totals from your bookings plus optional ledger rows. Open a booking to complete payment when
          status is still pending.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-soft">Booking charges</h2>
        <div className={cn('overflow-hidden rounded-2xl border border-stroke', cardSurfaceBase, cardSurfaceTransition)}>
          <table className="w-full text-left text-sm">
            <thead className="bg-fill-glass text-[11px] font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Invoice ref</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke">
              {bookings.map((b) => (
                <tr key={b.id} className="text-muted">
                  <td className="px-4 py-3 font-mono text-xs text-soft">OX-{b.id.replace(/-/g, '').slice(0, 10).toUpperCase()}</td>
                  <td className="px-4 py-3 text-soft">{formatBookingVehicleTitle(b)}</td>
                  <td className="px-4 py-3 tabular-nums text-soft">{formatInr(b.total_rupees)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={b.payment_status === 'paid' ? 'success' : 'electric'}>{b.payment_status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="secondary" to={`/dashboard/bookings/${b.id}`}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 ? <p className="px-4 py-6 text-center text-sm text-muted">No booking charges yet.</p> : null}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-soft">Security deposit tracking</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {bookings.slice(0, 4).map((b) => {
            const vehJoin = b.vehicles
            const v = Array.isArray(vehJoin) ? vehJoin[0] : vehJoin
            const dep = v?.security_deposit ?? 0
            return (
              <Card key={b.id} className={cn(cardSurfaceHover, cardSurfaceTransition)}>
                <CardContent className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Per booking</p>
                  <p className="mt-1 font-semibold text-soft">{formatBookingVehicleTitle(b)}</p>
                  <p className="mt-3 text-2xl font-semibold tabular-nums text-soft">{formatInr(dep)}</p>
                  <p className="mt-1 text-xs text-muted">Pre-auth at pickup · released after inspection (ops workflow).</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
        {bookings.length === 0 ? <p className="text-sm text-muted">No deposits to display.</p> : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-soft">Ledger events</h2>
        <div className={cn('overflow-hidden rounded-2xl border border-stroke', cardSurfaceBase)}>
          <table className="w-full text-left text-sm">
            <thead className="bg-fill-glass text-[11px] font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Direction</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke">
              {events.map((e) => (
                <tr key={e.id} className="text-muted">
                  <td className="px-4 py-3 text-soft">{e.title}</td>
                  <td className="px-4 py-3 capitalize">{e.direction}</td>
                  <td className="px-4 py-3 tabular-nums text-soft">{formatInr(e.amount_rupees)}</td>
                  <td className="px-4 py-3 text-xs">{new Date(e.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">No ledger rows — optional `payment_events` inserts.</p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
