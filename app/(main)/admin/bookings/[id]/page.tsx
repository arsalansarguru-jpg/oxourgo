import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminBookingOpsPanel } from '@/components/admin/admin-booking-ops-panel'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { adminGetBooking } from '@/lib/admin/data/bookings'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatInr } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let booking: Awaited<ReturnType<typeof adminGetBooking>> = null
  try {
    booking = await adminGetBooking(id)
  } catch {
    booking = null
  }
  if (!booking) notFound()

  let customerEmail: string | null = null
  try {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.getUserById(booking.user_id)
    customerEmail = data?.user?.email ?? null
  } catch {
    customerEmail = null
  }

  const vehJoin = booking.vehicles
  const veh = Array.isArray(vehJoin) ? vehJoin[0] : vehJoin
  const carTitle = veh ? (veh.name?.trim() || `${veh.brand}`.trim()) : 'Vehicle'

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Booking"
        title={carTitle}
        description={`Customer ${customerEmail ?? booking.user_id} · ${new Date(booking.pickup_date).toLocaleString()} → ${new Date(booking.return_date).toLocaleString()}`}
      />

      <div className="flex flex-wrap gap-2">
        <AdminStatusPill value={booking.booking_status} />
        <AdminStatusPill value={booking.payment_status} />
      </div>

      {booking.ops_note ? (
        <p className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 text-sm leading-relaxed text-muted shadow-[var(--shadow-card)] backdrop-blur-md">
          <span className="font-medium text-soft">Ops note: </span>
          {booking.ops_note}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <AdminCard>
          <AdminCardContent className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">Trip</h2>
            <dl className="grid gap-2.5">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Pickup</dt>
                <dd className="text-right text-soft">{booking.pickup_location}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Return</dt>
                <dd className="text-right text-soft">{booking.return_location}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Days</dt>
                <dd className="text-soft">{booking.rental_days}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-white/[0.08] pt-3 text-base font-semibold">
                <dt className="text-soft">Total</dt>
                <dd className="tabular-nums text-soft">{formatInr(booking.total_rupees)}</dd>
              </div>
              {veh ? (
                <div className="flex justify-between gap-4 text-xs text-muted">
                  <dt>Security deposit (vehicle)</dt>
                  <dd className="tabular-nums text-soft">{formatInr(veh.security_deposit)}</dd>
                </div>
              ) : null}
            </dl>
          </AdminCardContent>
        </AdminCard>

        <AdminBookingOpsPanel booking={booking} />
      </div>

      <p className="text-center text-sm text-muted">
        <Link href="/admin/bookings" className="font-medium text-electric transition-colors hover:text-electric/85">
          ← All bookings
        </Link>
      </p>
    </div>
  )
}
