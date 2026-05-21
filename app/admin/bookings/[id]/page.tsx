import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminBookingPdfPanel } from '@/components/admin/admin-booking-pdf-panel'
import { AdminBookingOpsPanel } from '@/components/admin/admin-booking-ops-panel'
import { AdminBookingManualOpsPanel } from '@/components/admin/operations/admin-booking-manual-ops-panel'
import { AdminBookingViolationsPanel } from '@/components/admin/violations/admin-booking-violations-panel'
import { AdminBookingPaymentTimeline } from '@/components/admin/admin-booking-payment-timeline'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { fleetCatalogTitle } from '@/lib/admin/fleet-display'
import { adminGetBooking, adminGetBookingCustomerProfile } from '@/lib/admin/data/bookings'
import { resolveCustomerDisplayName } from '@/lib/customer/display-name'
import { adminGetBookingInspectionBundle } from '@/lib/admin/data/booking-inspection'
import { adminGetBookingFinancialSummary } from '@/lib/admin/data/financials'
import { adminGetBookingViolationsBundle } from '@/lib/admin/data/violations'
import { adminListPaymentEventsForBooking } from '@/lib/admin/data/payments'
import { listAuditLogsForBooking } from '@/lib/admin/data/audit-logs'
import {
  adminListBookingOpsActivity,
  adminListBookingVehicleAssignments,
} from '@/lib/admin/data/operations'
import { AdminAuditTimelineSection } from '@/components/admin/audit/admin-audit-timeline-section'
import { adminListVehicles } from '@/lib/admin/data/fleet'
import { canUseOpsOverride, hasPermission } from '@/lib/auth/permissions'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatInr } from '@/lib/format'
import { formatPaymentMethodLabel } from '@/lib/payments/booking-payment'
import { BookingSourceBadge } from '@/components/admin/bookings/booking-source-badge'
import { KycStatusBadge } from '@/components/kyc/kyc-status-badge'

export const dynamic = 'force-dynamic'

function fmtTs(iso: string | null | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return '—'
  }
}

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let booking: Awaited<ReturnType<typeof adminGetBooking>> = null
  try {
    booking = await adminGetBooking(id)
  } catch {
    booking = null
  }
  if (!booking) notFound()

  const session = await getAuthSessionSummary()
  const role = session?.appRole ?? 'customer'

  const [
    customerEmail,
    customerProfile,
    paymentTimeline,
    inspection,
    financialSummary,
    violationsBundle,
    vehicles,
    opsActivity,
    vehicleAssignments,
    auditTimeline,
  ] = await Promise.all([
    (async () => {
      try {
        const admin = createAdminClient()
        const { data } = await admin.auth.admin.getUserById(booking.user_id)
        return data?.user?.email ?? null
      } catch {
        return null
      }
    })(),
    adminGetBookingCustomerProfile(booking.user_id),
    adminListPaymentEventsForBooking(id),
    adminGetBookingInspectionBundle(id, booking.customer_handover_signature_path),
    adminGetBookingFinancialSummary(id),
    adminGetBookingViolationsBundle(id),
    adminListVehicles(),
    adminListBookingOpsActivity(id),
    adminListBookingVehicleAssignments(id),
    listAuditLogsForBooking(id),
  ])

  const vehJoin = booking.vehicles
  const veh = Array.isArray(vehJoin) ? vehJoin[0] : vehJoin
  const carTitle = veh
    ? fleetCatalogTitle({
        id: veh.id ?? booking.vehicle_id ?? 'vehicle',
        name: veh.name,
        brand: veh.brand,
        registration_number: (veh as { registration_number?: string | null }).registration_number ?? null,
      })
    : 'Vehicle'

  let authMeta: { full_name?: string; name?: string; display_name?: string } | null = null
  try {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.getUserById(booking.user_id)
    const raw = data?.user?.user_metadata
    authMeta =
      raw && typeof raw === 'object'
        ? {
            full_name: typeof raw.full_name === 'string' ? raw.full_name : undefined,
            name: typeof raw.name === 'string' ? raw.name : undefined,
            display_name: typeof raw.display_name === 'string' ? raw.display_name : undefined,
          }
        : null
  } catch {
    authMeta = null
  }
  const customerDisplayName = resolveCustomerDisplayName({
    userId: booking.user_id,
    fullName: customerProfile?.full_name ?? null,
    email: customerEmail,
    phone: customerProfile?.phone ?? null,
    authMetadata: authMeta,
  })

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Booking"
        title={carTitle}
        description={`${customerDisplayName} · ${new Date(booking.pickup_date).toLocaleString()} → ${new Date(booking.return_date).toLocaleString()}`}
      />

      <div className="flex flex-wrap gap-2">
        <AdminStatusPill value={booking.booking_status} />
        <AdminStatusPill value={booking.payment_status} />
        <BookingSourceBadge source={booking.booking_source} />
        {booking.ops_hold_at ? <AdminStatusPill value="on_hold" /> : null}
        {booking.vip_flag ? <AdminStatusPill value="vip" /> : null}
      </div>

      {booking.ops_note ? (
        <p className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 text-sm leading-relaxed text-muted shadow-[var(--shadow-card)] backdrop-blur-md">
          <span className="font-medium text-soft">Customer / ops note: </span>
          {booking.ops_note}
        </p>
      ) : null}

      <AdminCard>
        <AdminCardContent className="space-y-4 p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-soft">Customer &amp; compliance</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Display name</dt>
              <dd className="font-medium text-soft">{customerDisplayName}</dd>
            </div>
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="text-soft">{customerProfile?.phone?.trim() || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="break-all text-soft">{customerEmail ?? '—'}</dd>
            </div>
            <div className="flex flex-col gap-2">
              <dt className="text-muted">KYC</dt>
              <dd className="flex flex-wrap items-center gap-2">
                <KycStatusBadge status={customerProfile?.kyc_status ?? 'not_started'} />
                <Link
                  href={`/admin/kyc/review/${booking.user_id}`}
                  className="text-xs font-semibold text-electric underline-offset-4 hover:underline"
                >
                  Open KYC dossier →
                </Link>
              </dd>
            </div>
          </dl>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="space-y-4 p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-soft">Lifecycle timestamps</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Approved at</dt>
              <dd className="text-soft">{fmtTs(booking.approved_at)}</dd>
            </div>
            <div>
              <dt className="text-muted">Handed over at</dt>
              <dd className="text-soft">{fmtTs(booking.handed_over_at)}</dd>
            </div>
            <div>
              <dt className="text-muted">Returned at</dt>
              <dd className="text-soft">{fmtTs(booking.returned_at)}</dd>
            </div>
            <div>
              <dt className="text-muted">Completed at</dt>
              <dd className="text-soft">{fmtTs(booking.completed_at)}</dd>
            </div>
          </dl>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="space-y-4 p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-soft">Payment snapshot</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Method</dt>
              <dd className="text-soft">{formatPaymentMethodLabel(booking.payment_method)}</dd>
            </div>
            <div>
              <dt className="text-muted">Rental collected</dt>
              <dd className="tabular-nums text-soft">{formatInr(booking.amount_paid ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-muted">Balance due</dt>
              <dd className="tabular-nums text-soft">{formatInr(booking.amount_due ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-muted">Received at</dt>
              <dd className="text-soft">{fmtTs(booking.payment_received_at)}</dd>
            </div>
          </dl>
        </AdminCardContent>
      </AdminCard>

      <AdminCard>
        <AdminCardContent className="space-y-4 p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-soft">Payment history</h2>
          <p className="text-sm text-muted">Ledger lines and operational entries for this booking.</p>
          <AdminBookingPaymentTimeline events={paymentTimeline} />
        </AdminCardContent>
      </AdminCard>

      <AdminAuditTimelineSection
        title="Booking activity timeline"
        description="Approvals, payments, fleet changes, and manual ops recorded for this booking."
        entries={auditTimeline}
        compact
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <AdminCard>
          <AdminCardContent className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">Trip &amp; pricing</h2>
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
              <div className="flex justify-between gap-4 border-t border-white/[0.08] pt-3 text-muted">
                <dt>Subtotal</dt>
                <dd className="tabular-nums text-soft">{formatInr(booking.subtotal_rupees)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-muted">
                <dt>Concierge &amp; connectivity</dt>
                <dd className="tabular-nums text-soft">{formatInr(booking.convenience_fee_rupees)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-muted">
                <dt>GST</dt>
                <dd className="tabular-nums text-soft">{formatInr(booking.gst_rupees)}</dd>
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
              <div className="flex justify-between gap-4 text-xs text-muted">
                <dt>Deposit tracked (booking)</dt>
                <dd className="tabular-nums text-soft">
                  {booking.deposit_held_rupees != null ? formatInr(booking.deposit_held_rupees) : '—'}
                </dd>
              </div>
            </dl>
          </AdminCardContent>
        </AdminCard>

        <AdminBookingOpsPanel booking={booking} inspection={inspection} financialSummary={financialSummary} />
      </div>

      {hasPermission(role, 'ops.manual.read') ? (
        <AdminBookingManualOpsPanel
          booking={booking}
          vehicles={vehicles}
          activity={opsActivity}
          assignments={vehicleAssignments}
          canOverride={canUseOpsOverride(role)}
          canFinance={hasPermission(role, 'payments.write') || hasPermission(role, 'refunds.write')}
        />
      ) : null}

      <AdminBookingViolationsPanel bookingId={id} bundle={violationsBundle} />

      <AdminCard>
        <AdminCardContent className="space-y-2 p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-soft">Documents &amp; agreements</h2>
          <p className="text-sm text-muted">Generate PDFs for concierge, customer email, or audit packs.</p>
          <AdminBookingPdfPanel bookingId={booking.id} />
        </AdminCardContent>
      </AdminCard>

      <p className="text-center text-sm text-muted">
        <Link href="/admin/bookings" className="font-medium text-electric transition-colors hover:text-electric/85">
          ← All bookings
        </Link>
      </p>
    </div>
  )
}
