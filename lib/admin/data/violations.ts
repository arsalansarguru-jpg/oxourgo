import 'server-only'

import {
  sumViolationAmounts,
  violationsByTypeCounts,
  type ViolationEventRow,
  type ViolationRow,
} from '@/lib/booking/violations'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

const violationSelect = `
  id,
  booking_id,
  user_id,
  violation_type,
  amount_rupees,
  reason,
  violation_date,
  authority_source,
  notes,
  status,
  challan_storage_path,
  challan_mime,
  challan_file_name,
  amount_paid_rupees,
  amount_deducted_rupees,
  customer_notified_at,
  paid_at,
  deducted_at,
  resolved_at,
  created_by,
  created_at,
  updated_at
`

export type AdminViolationWithBooking = ViolationRow & {
  booking: {
    id: string
    pickup_date: string
    return_date: string
    booking_status: string
    user_id: string
    vehicles: { name: string | null; brand: string | null } | { name: string | null; brand: string | null }[] | null
  }
}

export type AdminViolationMetrics = {
  totalFinesCollectedRupees: number
  outstandingLiabilitiesRupees: number
  openViolationsCount: number
  topViolationTypes: ReturnType<typeof violationsByTypeCounts>
}

export type AdminBookingViolationsBundle = {
  violations: ViolationRow[]
  events: ViolationEventRow[]
  challanSignedUrls: Record<string, string>
  summary: ReturnType<typeof sumViolationAmounts>
}

function vehicleLabelFromJoin(
  vehicles: AdminViolationWithBooking['booking']['vehicles'],
): string {
  const v = Array.isArray(vehicles) ? vehicles[0] : vehicles
  if (!v) return 'Vehicle'
  return v.name?.trim() || v.brand?.trim() || 'Vehicle'
}

async function signedChallanUrls(
  admin: ReturnType<typeof createAdminClient>,
  violations: ViolationRow[],
): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  await Promise.all(
    violations
      .filter((v) => v.challan_storage_path)
      .map(async (v) => {
        const { data, error } = await admin.storage
          .from('booking_violation_challans')
          .createSignedUrl(v.challan_storage_path!, 3600)
        if (!error && data?.signedUrl) out[v.id] = data.signedUrl
      }),
  )
  return out
}

function mapEvents(rows: Array<{
  id: string
  violation_id: string
  booking_id: string
  event_type: string
  payload: unknown
  actor_user_id: string | null
  created_at: string
}>): ViolationEventRow[] {
  return rows.map((e) => ({
    id: e.id,
    violation_id: e.violation_id,
    booking_id: e.booking_id,
    event_type: e.event_type,
    payload: (e.payload && typeof e.payload === 'object' ? e.payload : {}) as Record<string, unknown>,
    actor_user_id: e.actor_user_id,
    created_at: e.created_at,
  }))
}

export async function adminGetBookingViolationsBundle(bookingId: string): Promise<AdminBookingViolationsBundle> {
  const admin = createAdminClient()
  const empty = { violations: [], events: [], challanSignedUrls: {}, summary: sumViolationAmounts([]) }

  const { data: violations, error: vErr } = await admin
    .from('booking_violations')
    .select(violationSelect)
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })

  if (vErr) {
    logPostgrestError('adminGetBookingViolationsBundle', vErr)
    return empty
  }

  const list = (violations ?? []) as ViolationRow[]
  const summary = sumViolationAmounts(list)

  const { data: events, error: eErr } = await admin
    .from('booking_violation_events')
    .select('id, violation_id, booking_id, event_type, payload, actor_user_id, created_at')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (eErr) logPostgrestError('adminGetBookingViolationsBundle:events', eErr)

  const challanSignedUrls = await signedChallanUrls(admin, list)

  return {
    violations: list,
    events: mapEvents(events ?? []),
    challanSignedUrls,
    summary,
  }
}

export async function adminViolationMetrics(): Promise<AdminViolationMetrics> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('booking_violations').select('violation_type, amount_rupees, status')

  if (error) {
    logPostgrestError('adminViolationMetrics', error)
    return {
      totalFinesCollectedRupees: 0,
      outstandingLiabilitiesRupees: 0,
      openViolationsCount: 0,
      topViolationTypes: [],
    }
  }

  const rows = (data ?? []) as Array<Pick<ViolationRow, 'violation_type' | 'amount_rupees' | 'status'>>
  const summary = sumViolationAmounts(rows)
  const openViolationsCount = rows.filter(
    (r) => r.status === 'pending' || r.status === 'customer_notified' || r.status === 'disputed',
  ).length

  return {
    totalFinesCollectedRupees: summary.collectedRupees,
    outstandingLiabilitiesRupees: summary.outstandingRupees,
    openViolationsCount,
    topViolationTypes: violationsByTypeCounts(rows).slice(0, 6),
  }
}

type BookingJoinLite = AdminViolationWithBooking['booking']

async function loadBookingsByIds(
  admin: ReturnType<typeof createAdminClient>,
  bookingIds: string[],
): Promise<Map<string, BookingJoinLite>> {
  const map = new Map<string, BookingJoinLite>()
  if (bookingIds.length === 0) return map

  const { data, error } = await admin
    .from('bookings')
    .select(
      `
      id,
      pickup_date,
      return_date,
      booking_status,
      user_id,
      vehicles ( name, brand )
    `,
    )
    .in('id', bookingIds)

  if (error) {
    logPostgrestError('loadBookingsByIds', error)
    return map
  }

  for (const row of data ?? []) {
    map.set(row.id, row as unknown as BookingJoinLite)
  }
  return map
}

export async function adminListViolations(limit = 120): Promise<AdminViolationWithBooking[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('booking_violations')
    .select(violationSelect)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logPostgrestError('adminListViolations', error)
    return []
  }

  const violations = (data ?? []) as ViolationRow[]
  const bookingMap = await loadBookingsByIds(admin, [...new Set(violations.map((v) => v.booking_id))])

  return violations
    .map((violation) => {
      const booking = bookingMap.get(violation.booking_id)
      if (!booking) return null
      return {
        ...violation,
        booking,
        vehicleLabel: vehicleLabelFromJoin(booking.vehicles),
      }
    })
    .filter((row): row is AdminViolationWithBooking & { vehicleLabel: string } => row != null)
}

export async function adminOutstandingFinesByBooking(): Promise<
  Array<{
    bookingId: string
    outstandingRupees: number
    violationCount: number
    pickupDate: string
    vehicleLabel: string
    bookingStatus: string
  }>
> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('booking_violations')
    .select('booking_id, amount_rupees, status')
    .in('status', ['pending', 'customer_notified', 'disputed'])

  if (error) {
    logPostgrestError('adminOutstandingFinesByBooking', error)
    return []
  }

  const rows = (data ?? []) as Array<{ booking_id: string; amount_rupees: number; status: string }>
  const bookingMap = await loadBookingsByIds(admin, [...new Set(rows.map((r) => r.booking_id))])

  const map = new Map<
    string,
    {
      outstandingRupees: number
      violationCount: number
      pickupDate: string
      vehicleLabel: string
      bookingStatus: string
    }
  >()

  for (const r of rows) {
    const booking = bookingMap.get(r.booking_id)
    if (!booking) continue
    const prev = map.get(r.booking_id) ?? {
      outstandingRupees: 0,
      violationCount: 0,
      pickupDate: booking.pickup_date,
      vehicleLabel: vehicleLabelFromJoin(booking.vehicles),
      bookingStatus: booking.booking_status,
    }
    prev.outstandingRupees += Math.max(0, Math.round(r.amount_rupees ?? 0))
    prev.violationCount += 1
    map.set(r.booking_id, prev)
  }

  return [...map.entries()]
    .map(([bookingId, stats]) => ({ bookingId, ...stats }))
    .sort((a, b) => b.outstandingRupees - a.outstandingRupees)
}
