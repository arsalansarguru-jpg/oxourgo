import 'server-only'

import type { PostgrestError } from '@supabase/supabase-js'

import type { AppAuthRole } from '@/lib/auth/roles'
import { hasPermission } from '@/lib/auth/permissions'
import { buildAuditActorLookup, type AuditActorLookup } from '@/lib/admin/data/audit-actors'
import { listAuditLogs, type AuditLogRow } from '@/lib/admin/data/audit-logs'
import { istDayStartIso, toIstYmd } from '@/lib/admin/analytics-range'
import { bookingCollectedRupees } from '@/lib/admin/booking-financials'
import { formatInr } from '@/lib/format'
import { safeRupees } from '@/lib/money/safe'
import { adminFinancialMetrics } from '@/lib/admin/data/financials'
import { adminPaymentOperationsMetrics } from '@/lib/admin/data/payments'
import { adminViolationMetrics } from '@/lib/admin/data/violations'
import { countPendingKycCustomers } from '@/lib/admin/kyc-metrics'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type CommandCenterVisibility = {
  finance: boolean
  fleet: boolean
  audit: boolean
  kyc: boolean
}

export type CommandCenterLiveMetrics = {
  activeTrips: number
  pendingBookings: number
  pendingKyc: number
  pendingPayments: number
  overdueReturns: number
  availableVehicles: number
}

export type CommandCenterFinance = {
  revenueTodayRupees: number
  pendingCollectionsRupees: number
  depositsHeldRupees: number
  refundsPendingCount: number
  refundsPendingRupees: number
  penaltiesOutstandingRupees: number
}

export type CommandCenterFleetStatus = {
  available: number
  booked: number
  maintenance: number
  serviceMode: number
  accidentHold: number
  total: number
}

export type CommandCenterQueue = {
  bookingsNeedingApproval: number
  kycPendingReview: number
  paymentsPendingConfirmation: number
  vehiclesNeedingInspection: number
}

export type CommandCenterUpcomingItem = {
  id: string
  kind: 'pickup' | 'return' | 'expiring' | 'refund'
  label: string
  sublabel: string
  whenLabel: string
  href: string
}

export type CommandCenterAlert = {
  id: string
  severity: 'critical' | 'warn' | 'info'
  title: string
  detail: string
  href: string | null
}

export type CommandCenterBundle = {
  visibility: CommandCenterVisibility
  live: CommandCenterLiveMetrics
  finance: CommandCenterFinance | null
  fleet: CommandCenterFleetStatus | null
  queue: CommandCenterQueue
  auditEntries: AuditLogRow[]
  actorLookup: AuditActorLookup
  upcoming: CommandCenterUpcomingItem[]
  alerts: CommandCenterAlert[]
  loadedAt: string
}

function utcTodayYmd(): string {
  return new Date().toISOString().slice(0, 10)
}

function resolveVisibility(role: AppAuthRole): CommandCenterVisibility {
  return {
    finance: hasPermission(role, 'payments.read') || hasPermission(role, 'deposits.read'),
    fleet: hasPermission(role, 'fleet.read'),
    audit: hasPermission(role, 'admin.audit.read'),
    kyc: hasPermission(role, 'kyc.read'),
  }
}

const EMPTY_LIVE: CommandCenterLiveMetrics = {
  activeTrips: 0,
  pendingBookings: 0,
  pendingKyc: 0,
  pendingPayments: 0,
  overdueReturns: 0,
  availableVehicles: 0,
}

const EMPTY_QUEUE: CommandCenterQueue = {
  bookingsNeedingApproval: 0,
  kycPendingReview: 0,
  paymentsPendingConfirmation: 0,
  vehiclesNeedingInspection: 0,
}

function readCount(label: string, res: { count: number | null; error: PostgrestError | null }): number {
  if (res.error) logPostgrestError(`[commandCenter] ${label}`, res.error)
  return res.count ?? 0
}

async function fetchLiveMetrics(admin: ReturnType<typeof createAdminClient>, today: string): Promise<CommandCenterLiveMetrics> {
  const [
    activeTripsRes,
    pendingBookingsRes,
    pendingKycCount,
    pendingPaymentsRes,
    overdueReturnsRes,
    availableVehiclesRes,
  ] = await Promise.all([
    admin.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'active').is('deleted_at', null),
    admin.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'pending_payment').is('deleted_at', null),
    countPendingKycCustomers(),
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .neq('booking_status', 'cancelled')
      .in('payment_status', ['pending', 'partial']),
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_status', 'active')
      .lt('return_date', today),
    admin
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('availability_status', 'available')
      .or('available.is.null,available.eq.true'),
  ])

  return {
    activeTrips: readCount('activeTrips', activeTripsRes),
    pendingBookings: readCount('pendingBookings', pendingBookingsRes),
    pendingKyc: pendingKycCount,
    pendingPayments: readCount('pendingPayments', pendingPaymentsRes),
    overdueReturns: readCount('overdueReturns', overdueReturnsRes),
    availableVehicles: readCount('availableVehicles', availableVehiclesRes),
  }
}

async function fetchFleetStatus(admin: ReturnType<typeof createAdminClient>, today: string): Promise<CommandCenterFleetStatus> {
  const [vehiclesRes, bookingsRes] = await Promise.all([
    admin.from('vehicles').select('id, availability_status').is('deleted_at', null),
    admin
      .from('bookings')
      .select('vehicle_id')
      .in('booking_status', ['confirmed', 'active'])
      .not('vehicle_id', 'is', null)
      .lte('pickup_date', today)
      .gte('return_date', today),
  ])

  if (vehiclesRes.error) logPostgrestError('[commandCenter] fleet vehicles', vehiclesRes.error)
  if (bookingsRes.error) logPostgrestError('[commandCenter] fleet bookings', bookingsRes.error)

  const rows = (vehiclesRes.data ?? []) as { id: string; availability_status: string }[]
  let available = 0
  let maintenance = 0
  let serviceMode = 0
  let accidentHold = 0

  for (const v of rows) {
    const s = (v.availability_status ?? '').trim().toLowerCase()
    if (s === 'maintenance') maintenance += 1
    else if (s === 'service') serviceMode += 1
    else if (s === 'accident_hold') accidentHold += 1
    else if (s === 'available') available += 1
  }

  const onTripIds = new Set(
    (bookingsRes.data ?? [])
      .map((r: { vehicle_id: string | null }) => r.vehicle_id)
      .filter((id): id is string => Boolean(id)),
  )
  const booked = onTripIds.size
  const total = rows.length

  return { available, booked, maintenance, serviceMode, accidentHold, total }
}

async function fetchQueue(admin: ReturnType<typeof createAdminClient>): Promise<CommandCenterQueue> {
  const [
    bookingsNeedingApprovalRes,
    kycPendingReviewCount,
    paymentsPendingConfirmationRes,
    pickupInspectionRes,
    returnInspectionRes,
  ] = await Promise.all([
    admin.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'pending_payment').is('deleted_at', null),
    countPendingKycCustomers(),
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .neq('booking_status', 'cancelled')
      .eq('payment_status', 'pending'),
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_status', 'confirmed')
      .is('pickup_inspection_completed_at', null),
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_status', 'active')
      .is('return_inspection_completed_at', null),
  ])

  const pickupInspection = readCount('pickupInspection', pickupInspectionRes)
  const returnInspection = readCount('returnInspection', returnInspectionRes)

  return {
    bookingsNeedingApproval: readCount('bookingsNeedingApproval', bookingsNeedingApprovalRes),
    kycPendingReview: kycPendingReviewCount,
    paymentsPendingConfirmation: readCount('paymentsPendingConfirmation', paymentsPendingConfirmationRes),
    vehiclesNeedingInspection: pickupInspection + returnInspection,
  }
}

async function sumRevenueToday(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  const dayStart = istDayStartIso(toIstYmd())
  const { data, error } = await admin
    .from('payment_events')
    .select('amount_rupees, direction, status')
    .gte('created_at', dayStart)
    .in('direction', ['charge', 'rental_collection'])
    .limit(5000)

  if (error) {
    logPostgrestError('[commandCenter] revenueToday', error)
    return 0
  }

  let sum = 0
  for (const row of data ?? []) {
    const st = (row.status ?? '').trim().toLowerCase()
    if (st === 'void') continue
    if (st && st !== 'posted' && st !== 'completed' && st !== 'succeeded') continue
    sum += safeRupees(row.amount_rupees)
  }
  if (sum > 0) return sum

  const { data: bookings, error: bErr } = await admin
    .from('bookings')
    .select('booking_status, payment_status, amount_paid, amount_due, total_rupees, updated_at, created_at')
    .is('deleted_at', null)
    .or(`updated_at.gte.${dayStart},created_at.gte.${dayStart}`)
    .limit(3000)
  if (bErr) {
    logPostgrestError('[commandCenter] revenueToday.bookingsFallback', bErr)
    return 0
  }
  for (const b of bookings ?? []) {
    const row = b as {
      booking_status: string
      payment_status: string
      amount_paid: number | null
      amount_due: number | null
      total_rupees: number | null
      updated_at: string
      created_at: string
    }
    const touchedToday = row.updated_at >= dayStart || row.created_at >= dayStart
    if (!touchedToday) continue
    sum += bookingCollectedRupees(row)
  }
  return sum
}

async function fetchFinance(admin: ReturnType<typeof createAdminClient>): Promise<CommandCenterFinance> {
  const [revenueTodayRupees, paymentMetrics, financialMetrics, violationMetrics] = await Promise.all([
    sumRevenueToday(admin),
    adminPaymentOperationsMetrics(),
    adminFinancialMetrics(),
    adminViolationMetrics(),
  ])

  return {
    revenueTodayRupees,
    pendingCollectionsRupees: paymentMetrics.pendingCollectionRupees,
    depositsHeldRupees: financialMetrics.totalDepositsHeldRupees,
    refundsPendingCount: financialMetrics.pendingRefundsCount,
    refundsPendingRupees: financialMetrics.pendingRefundsRupees,
    penaltiesOutstandingRupees: violationMetrics.outstandingLiabilitiesRupees,
  }
}

type BookingSnippet = {
  id: string
  pickup_date: string
  return_date: string
  booking_status: string
  payment_status: string
  deposit_status: string | null
  refund_amount: number | null
  user_id: string
  vehicle_id: string | null
}

async function vehicleLabelMap(
  admin: ReturnType<typeof createAdminClient>,
  vehicleIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (vehicleIds.length === 0) return map

  const { data, error } = await admin.from('vehicles').select('id, name, brand').is('deleted_at', null).in('id', vehicleIds)
  if (error) {
    logPostgrestError('[commandCenter] vehicleLabelMap', error)
    return map
  }

  for (const v of data ?? []) {
    const label = (v as { name: string | null; brand: string | null }).name?.trim()
      || (v as { name: string | null; brand: string | null }).brand?.trim()
      || 'Vehicle'
    map.set((v as { id: string }).id, label)
  }
  return map
}

function bookingLabel(row: BookingSnippet, vehicles: Map<string, string>): string {
  if (row.vehicle_id && vehicles.has(row.vehicle_id)) return vehicles.get(row.vehicle_id)!
  return `Booking ${row.id.slice(0, 8)}`
}

async function fetchUpcoming(
  admin: ReturnType<typeof createAdminClient>,
  today: string,
  visibility: CommandCenterVisibility,
): Promise<CommandCenterUpcomingItem[]> {
  const select =
    'id, pickup_date, return_date, booking_status, payment_status, deposit_status, refund_amount, user_id, vehicle_id'

  const [pickupsRes, returnsRes, expiringRes, refundsRes] = await Promise.all([
    admin
      .from('bookings')
      .select(select)
      .in('booking_status', ['confirmed', 'pending_payment'])
      .eq('pickup_date', today)
      .order('pickup_date', { ascending: true })
      .limit(6),
    admin
      .from('bookings')
      .select(select)
      .in('booking_status', ['active', 'confirmed'])
      .eq('return_date', today)
      .order('return_date', { ascending: true })
      .limit(6),
    admin
      .from('bookings')
      .select(select)
      .in('booking_status', ['confirmed', 'pending_payment'])
      .gte('return_date', today)
      .lte('return_date', today)
      .order('return_date', { ascending: true })
      .limit(4),
    visibility.finance
      ? admin
          .from('bookings')
          .select(select)
          .neq('booking_status', 'cancelled')
          .in('deposit_status', ['received', 'partially_refunded'])
          .is('refund_processed_at', null)
          .gt('refund_amount', 0)
          .order('return_date', { ascending: true })
          .limit(4)
      : Promise.resolve({ data: [], error: null }),
  ])

  for (const res of [pickupsRes, returnsRes, expiringRes, refundsRes]) {
    if (res.error) logPostgrestError('[commandCenter] upcoming', res.error)
  }

  const allRows = [
    ...((pickupsRes.data ?? []) as BookingSnippet[]),
    ...((returnsRes.data ?? []) as BookingSnippet[]),
    ...((expiringRes.data ?? []) as BookingSnippet[]),
    ...((refundsRes.data ?? []) as BookingSnippet[]),
  ]
  const vehicleIds = [...new Set(allRows.map((r) => r.vehicle_id).filter((id): id is string => Boolean(id)))]
  const vehicles = await vehicleLabelMap(admin, vehicleIds)

  const items: CommandCenterUpcomingItem[] = []

  for (const row of (pickupsRes.data ?? []) as BookingSnippet[]) {
    items.push({
      id: `pickup-${row.id}`,
      kind: 'pickup',
      label: bookingLabel(row, vehicles),
      sublabel: `Pickup · ${row.booking_status.replace(/_/g, ' ')}`,
      whenLabel: 'Today',
      href: `/admin/bookings/${row.id}`,
    })
  }

  for (const row of (returnsRes.data ?? []) as BookingSnippet[]) {
    items.push({
      id: `return-${row.id}`,
      kind: 'return',
      label: bookingLabel(row, vehicles),
      sublabel: `Return due · ${row.booking_status.replace(/_/g, ' ')}`,
      whenLabel: 'Today',
      href: `/admin/bookings/${row.id}`,
    })
  }

  for (const row of (expiringRes.data ?? []) as BookingSnippet[]) {
    if (items.some((i) => i.id === `expiring-${row.id}`)) continue
    items.push({
      id: `expiring-${row.id}`,
      kind: 'expiring',
      label: bookingLabel(row, vehicles),
      sublabel: 'Contract ends today',
      whenLabel: row.return_date.slice(0, 10),
      href: `/admin/bookings/${row.id}`,
    })
  }

  if (visibility.finance) {
    for (const row of (refundsRes.data ?? []) as BookingSnippet[]) {
      const amt = Math.round(Number(row.refund_amount ?? 0))
      items.push({
        id: `refund-${row.id}`,
        kind: 'refund',
        label: `Refund pending · ${bookingLabel(row, vehicles)}`,
        sublabel: amt > 0 ? formatInr(amt) : 'Deposit release',
        whenLabel: 'Action needed',
        href: `/admin/bookings/${row.id}`,
      })
    }
  }

  return items.slice(0, 14)
}

async function fetchAlerts(
  admin: ReturnType<typeof createAdminClient>,
  today: string,
  live: CommandCenterLiveMetrics,
  fleet: CommandCenterFleetStatus | null,
  visibility: CommandCenterVisibility,
): Promise<CommandCenterAlert[]> {
  const alerts: CommandCenterAlert[] = []

  if (live.overdueReturns > 0) {
    alerts.push({
      id: 'overdue-returns',
      severity: 'critical',
      title: `${live.overdueReturns} overdue return${live.overdueReturns === 1 ? '' : 's'}`,
      detail: 'Active trips past return date — contact guests and update fleet status.',
      href: '/admin/bookings?status=active',
    })
  }

  if (visibility.finance && live.pendingPayments > 0) {
    alerts.push({
      id: 'unpaid-dues',
      severity: 'warn',
      title: `${live.pendingPayments} booking${live.pendingPayments === 1 ? '' : 's'} with open payments`,
      detail: 'Rental or balance still pending confirmation.',
      href: '/admin/payments',
    })
  }

  if (fleet && (fleet.maintenance > 0 || fleet.accidentHold > 0)) {
    const n = fleet.maintenance + fleet.accidentHold
    alerts.push({
      id: 'vehicle-issues',
      severity: 'warn',
      title: `${n} vehicle${n === 1 ? '' : 's'} off fleet`,
      detail: `${fleet.maintenance} maintenance · ${fleet.accidentHold} accident hold`,
      href: '/admin/fleet',
    })
  }

  const failedKycRes = visibility.kyc
    ? await admin.from('kyc_documents').select('id', { count: 'exact', head: true }).eq('status', 'rejected')
    : { count: 0, error: null }

  if (failedKycRes.error) logPostgrestError('[commandCenter] failedKyc', failedKycRes.error)

  const failedUploads = failedKycRes.count ?? 0
  if (failedUploads > 0) {
    alerts.push({
      id: 'failed-kyc',
      severity: 'info',
      title: `${failedUploads} rejected KYC document${failedUploads === 1 ? '' : 's'}`,
      detail: 'Customers may need resubmission or manual follow-up.',
      href: '/admin/kyc',
    })
  }

  const { count: holdsCount, error: holdsErr } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .not('ops_hold_at', 'is', null)

  if (holdsErr) logPostgrestError('[commandCenter] opsHolds', holdsErr)
  if ((holdsCount ?? 0) > 0) {
    alerts.push({
      id: 'ops-holds',
      severity: 'warn',
      title: `${holdsCount} booking${holdsCount === 1 ? '' : 's'} on ops hold`,
      detail: 'Manual review required before proceeding.',
      href: '/admin/operations',
    })
  }

  void today
  return alerts.slice(0, 8)
}

export async function fetchCommandCenterBundle(role: AppAuthRole): Promise<CommandCenterBundle> {
  const visibility = resolveVisibility(role)
  const today = utcTodayYmd()
  const loadedAt = new Date().toISOString()

  try {
    const admin = createAdminClient()

    const [live, queue, fleet, finance, auditEntries, upcoming] = await Promise.all([
      fetchLiveMetrics(admin, today),
      fetchQueue(admin),
      visibility.fleet ? fetchFleetStatus(admin, today) : Promise.resolve(null),
      visibility.finance ? fetchFinance(admin) : Promise.resolve(null),
      visibility.audit ? listAuditLogs({ limit: 20 }) : Promise.resolve([]),
      fetchUpcoming(admin, today, visibility),
    ])

    const actorLookup = visibility.audit
      ? await buildAuditActorLookup(auditEntries.map((e) => e.actorId))
      : {}

    const alerts = await fetchAlerts(admin, today, live, fleet, visibility)

    return {
      visibility,
      live,
      finance,
      fleet,
      queue,
      auditEntries,
      actorLookup,
      upcoming,
      alerts,
      loadedAt,
    }
  } catch {
    return {
      visibility,
      live: EMPTY_LIVE,
      finance: null,
      fleet: null,
      queue: EMPTY_QUEUE,
      auditEntries: [],
      actorLookup: {},
      upcoming: [],
      alerts: [],
      loadedAt,
    }
  }
}
