import 'server-only'

import type { PostgrestError } from '@supabase/supabase-js'

import { adminEnrichBookingsForAdminList, type AdminBookingListItem } from '@/lib/admin/data/bookings'
import {
  fetchCommandCenterBundle,
  type CommandCenterVisibility,
} from '@/lib/admin/data/command-center'
import { adminFinancialMetrics } from '@/lib/admin/data/financials'
import { adminPaymentOperationsMetrics } from '@/lib/admin/data/payments'
import { countPendingKycCustomers } from '@/lib/admin/kyc-metrics'
import type { AppAuthRole } from '@/lib/auth/roles'
import { hasPermission } from '@/lib/auth/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'
import type { BookingWithCar } from '@/lib/supabase/database.types'

export type OpsDashboardKpis = {
  totalBookings: number
  activeRentals: number
  pendingPayments: number
  pendingPaymentsRupees: number
  monthlyRevenue: number
  carsAvailable: number
  carsBooked: number
  pendingKyc: number
  refundsPending: number
  refundsPendingRupees: number
}

export type OpsLiveBookingRow = {
  id: string
  customerName: string
  carLabel: string
  pickupLabel: string
  returnLabel: string
  paymentStatus: string
  bookingStatus: string
  depositStatus: string
  href: string
}

export type OpsPaymentRow = {
  bookingId: string
  customerName: string
  totalRupees: number
  amountPaid: number
  amountDue: number
  paymentMethod: string | null
  paymentStatus: string
  depositStatus: string
  refundAmount: number | null
  href: string
}

export type OpsCustomerRow = {
  userId: string
  name: string
  phone: string | null
  email: string | null
  kycStatus: string
  bookingCount: number
  outstandingDues: number
  notesPreview: string | null
  href: string
}

export type OpsVehicleRow = {
  id: string
  name: string
  registration: string | null
  availabilityStatus: string
  tripStatus: string
  nextBookingLabel: string | null
  revenueRupees: number
  utilizationPct: number
  maintenanceStatus: string
  href: string
}

export type OpsPendingAction = {
  id: string
  title: string
  detail: string
  count: number
  href: string
  priority: 'high' | 'medium' | 'low'
}

export type OpsPaymentsSummary = {
  pendingTotalRupees: number
  collectedTotalRupees: number
  pendingBookingCount: number
}

export type OpsDashboardBundle = {
  visibility: CommandCenterVisibility
  kpis: OpsDashboardKpis
  liveOperations: OpsLiveBookingRow[]
  payments: OpsPaymentRow[]
  paymentsSummary: OpsPaymentsSummary
  customers: OpsCustomerRow[]
  vehicles: OpsVehicleRow[]
  pendingActions: OpsPendingAction[]
  loadedAt: string
}

const bookingSelectLite = `
  id,
  user_id,
  vehicle_id,
  pickup_date,
  return_date,
  pickup_location,
  return_location,
  booking_status,
  payment_status,
  payment_method,
  amount_due,
  amount_paid,
  total_rupees,
  deposit_status,
  refund_amount,
  admin_internal_notes,
  ops_note,
  created_at,
  vehicles ( id, name, brand )
`

function utcTodayYmd(): string {
  return new Date().toISOString().slice(0, 10)
}

function monthStartIso(): string {
  const y = new Date().getUTCFullYear()
  const m = new Date().getUTCMonth()
  return new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)).toISOString()
}

function readCount(label: string, res: { count: number | null; error: PostgrestError | null }): number {
  if (res.error) logPostgrestError(`[opsDashboard] ${label}`, res.error)
  return res.count ?? 0
}

function vehicleLabelFromBooking(b: BookingWithCar): string {
  const v = b.vehicles
  if (!v || Array.isArray(v)) return '—'
  return v.name?.trim() || v.brand?.trim() || 'Vehicle'
}

function formatTripDate(date: string, location?: string | null): string {
  const d = date?.slice(0, 10) ?? '—'
  const loc = location?.trim()
  return loc ? `${d} · ${loc}` : d
}

function customerDisplay(b: AdminBookingListItem): string {
  return b.customerFullName?.trim() || b.customerEmail?.trim() || `Guest ${b.user_id.slice(0, 8)}`
}

async function sumMonthlyRevenue(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  const start = monthStartIso()
  let sum = 0
  const page = 2000
  for (let from = 0, guard = 0; guard < 40; guard++) {
    const { data, error } = await admin
      .from('bookings')
      .select('booking_status, payment_status, amount_paid')
      .gte('created_at', start)
      .range(from, from + page - 1)
    if (error) {
      logPostgrestError('[opsDashboard] monthlyRevenue', error)
      break
    }
    for (const r of data ?? []) {
      const cancelled = (r.booking_status ?? '').trim().toLowerCase() === 'cancelled'
      const ps = (r.payment_status ?? '').trim().toLowerCase()
      if (!cancelled && (ps === 'received' || ps === 'partial')) {
        sum += Math.max(0, Math.round(Number(r.amount_paid ?? 0)))
      }
    }
    if ((data ?? []).length < page) break
    from += page
  }
  return sum
}

async function fetchKpis(admin: ReturnType<typeof createAdminClient>, today: string): Promise<OpsDashboardKpis> {
  const [totalRes, activeRes, pendingPayRes, availableRes, bookedRes, pendingKycCount, financial, paymentMetrics, monthlyRevenue] =
    await Promise.all([
      admin.from('bookings').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      admin.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'active').is('deleted_at', null),
      admin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .neq('booking_status', 'cancelled')
        .in('payment_status', ['pending', 'partial']),
      admin
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('availability_status', 'available'),
      admin
        .from('bookings')
        .select('vehicle_id')
        .in('booking_status', ['confirmed', 'active'])
        .not('vehicle_id', 'is', null)
        .lte('pickup_date', today)
        .gte('return_date', today),
      countPendingKycCustomers(),
      adminFinancialMetrics(),
      adminPaymentOperationsMetrics(),
      sumMonthlyRevenue(admin),
    ])

  const bookedIds = new Set(
    (bookedRes.data ?? []).map((r: { vehicle_id: string | null }) => r.vehicle_id).filter(Boolean),
  )

  return {
    totalBookings: readCount('totalBookings', totalRes),
    activeRentals: readCount('activeRentals', activeRes),
    pendingPayments: readCount('pendingPayments', pendingPayRes),
    pendingPaymentsRupees: paymentMetrics.pendingCollectionRupees,
    monthlyRevenue,
    carsAvailable: readCount('carsAvailable', availableRes),
    carsBooked: bookedIds.size,
    pendingKyc: pendingKycCount,
    refundsPending: financial.pendingRefundsCount,
    refundsPendingRupees: financial.pendingRefundsRupees,
  }
}

async function fetchLiveOperations(admin: ReturnType<typeof createAdminClient>): Promise<OpsLiveBookingRow[]> {
  const { data, error } = await admin
    .from('bookings')
    .select(bookingSelectLite)
    .in('booking_status', ['active', 'confirmed', 'pending_payment'])
    .order('pickup_date', { ascending: true })
    .limit(40)

  if (error) {
    logPostgrestError('[opsDashboard] liveOperations', error)
    return []
  }

  const enriched = await adminEnrichBookingsForAdminList((data ?? []) as unknown as BookingWithCar[])
  return enriched.map((b) => ({
    id: b.id,
    customerName: customerDisplay(b),
    carLabel: vehicleLabelFromBooking(b),
    pickupLabel: formatTripDate(b.pickup_date, b.pickup_location),
    returnLabel: formatTripDate(b.return_date, b.return_location),
    paymentStatus: b.payment_status,
    bookingStatus: b.booking_status,
    depositStatus: b.deposit_status ?? 'none',
    href: `/admin/bookings/${b.id}`,
  }))
}

async function fetchPaymentRows(admin: ReturnType<typeof createAdminClient>): Promise<OpsPaymentRow[]> {
  const { data, error } = await admin
    .from('bookings')
    .select(bookingSelectLite)
    .neq('booking_status', 'cancelled')
    .in('payment_status', ['pending', 'partial'])
    .order('amount_due', { ascending: false })
    .limit(25)

  if (error) {
    logPostgrestError('[opsDashboard] payments', error)
    return []
  }

  const enriched = await adminEnrichBookingsForAdminList((data ?? []) as unknown as BookingWithCar[])
  return enriched.map((b) => ({
    bookingId: b.id,
    customerName: customerDisplay(b),
    totalRupees: Math.round(Number(b.total_rupees ?? 0)),
    amountPaid: Math.round(Number(b.amount_paid ?? 0)),
    amountDue: Math.round(Number(b.amount_due ?? 0)),
    paymentMethod: b.payment_method,
    paymentStatus: b.payment_status,
    depositStatus: b.deposit_status ?? 'none',
    refundAmount: b.refund_amount != null ? Math.round(Number(b.refund_amount)) : null,
    href: `/admin/bookings/${b.id}`,
  }))
}

async function fetchCustomers(admin: ReturnType<typeof createAdminClient>): Promise<OpsCustomerRow[]> {
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('user_id, full_name, phone, kyc_status, admin_notes')
    .order('updated_at', { ascending: false })
    .limit(30)

  if (error) {
    logPostgrestError('[opsDashboard] customers', error)
    return []
  }
  if (!profiles?.length) return []

  const rows: OpsCustomerRow[] = []
  for (const p of profiles) {
    const [{ count: bookingCount }, { data: dueRows }, authRes] = await Promise.all([
      admin.from('bookings').select('id', { count: 'exact', head: true }).eq('user_id', p.user_id),
      admin
        .from('bookings')
        .select('amount_due')
        .eq('user_id', p.user_id)
        .neq('booking_status', 'cancelled')
        .in('payment_status', ['pending', 'partial'])
        .limit(200),
      admin.auth.admin.getUserById(p.user_id).catch(() => ({ data: { user: null } })),
    ])

    let outstanding = 0
    for (const d of dueRows ?? []) {
      outstanding += Math.max(0, Math.round(Number(d.amount_due ?? 0)))
    }

    const email = authRes.data?.user?.email ?? null
    const notes = (p as { admin_notes?: string | null }).admin_notes?.trim() || null

    rows.push({
      userId: p.user_id,
      name: p.full_name?.trim() || email || `User ${p.user_id.slice(0, 8)}`,
      phone: p.phone,
      email,
      kycStatus: p.kyc_status ?? 'not_started',
      bookingCount: bookingCount ?? 0,
      outstandingDues: outstanding,
      notesPreview: notes ? (notes.length > 60 ? `${notes.slice(0, 57)}…` : notes) : null,
      href: `/admin/customers/${p.user_id}`,
    })
  }

  return rows.sort((a, b) => b.outstandingDues - a.outstandingDues)
}

async function fetchVehicles(admin: ReturnType<typeof createAdminClient>, today: string): Promise<OpsVehicleRow[]> {
  const { data: vehicles, error } = await admin
    .from('vehicles')
    .select('id, name, brand, registration_number, availability_status, available')
    .is('deleted_at', null)
    .order('name', { ascending: true })
    .limit(40)

  if (error) {
    logPostgrestError('[opsDashboard] vehicles', error)
    return []
  }

  const { data: activeBookings } = await admin
    .from('bookings')
    .select('id, vehicle_id, pickup_date, return_date, booking_status, amount_paid')
    .in('booking_status', ['confirmed', 'active'])
    .not('vehicle_id', 'is', null)
    .gte('return_date', today)

  const onTripByVehicle = new Map<string, { pickup: string; return: string }>()
  const revenueByVehicle = new Map<string, number>()
  const bookingDaysByVehicle = new Map<string, number>()

  for (const b of activeBookings ?? []) {
    const vid = b.vehicle_id as string
    if (!vid) continue
    const pu = (b.pickup_date as string).slice(0, 10)
    const re = (b.return_date as string).slice(0, 10)
    if (pu <= today && re >= today) {
      onTripByVehicle.set(vid, { pickup: pu, return: re })
    }
    revenueByVehicle.set(vid, (revenueByVehicle.get(vid) ?? 0) + Math.max(0, Math.round(Number(b.amount_paid ?? 0))))
    bookingDaysByVehicle.set(vid, (bookingDaysByVehicle.get(vid) ?? 0) + 1)
  }

  const { data: upcoming } = await admin
    .from('bookings')
    .select('vehicle_id, pickup_date')
    .in('booking_status', ['confirmed', 'pending_payment'])
    .gt('pickup_date', today)
    .order('pickup_date', { ascending: true })
    .limit(80)

  const nextByVehicle = new Map<string, string>()
  for (const u of upcoming ?? []) {
    const vid = u.vehicle_id as string | null
    if (!vid || nextByVehicle.has(vid)) continue
    nextByVehicle.set(vid, (u.pickup_date as string).slice(0, 10))
  }

  const maxDays = Math.max(1, ...[...bookingDaysByVehicle.values()])

  return (vehicles ?? []).map((v) => {
    const status = (v.availability_status ?? 'available').trim().toLowerCase()
    const onTrip = onTripByVehicle.has(v.id)
    const tripStatus = onTrip ? 'On trip' : status === 'maintenance' ? 'Maintenance' : status === 'accident_hold' ? 'Accident hold' : 'Available'
    const days = bookingDaysByVehicle.get(v.id) ?? 0
    const utilizationPct = Math.min(100, Math.round((days / maxDays) * 100))

    return {
      id: v.id,
      name: v.name?.trim() || v.brand?.trim() || 'Vehicle',
      registration: v.registration_number,
      availabilityStatus: status,
      tripStatus,
      nextBookingLabel: nextByVehicle.get(v.id) ?? null,
      revenueRupees: revenueByVehicle.get(v.id) ?? 0,
      utilizationPct: onTrip ? Math.max(utilizationPct, 40) : utilizationPct,
      maintenanceStatus: status === 'maintenance' ? 'In maintenance' : status === 'service' ? 'Service mode' : 'OK',
      href: `/admin/fleet/${v.id}`,
    }
  })
}

async function fetchPendingActions(
  admin: ReturnType<typeof createAdminClient>,
  today: string,
  kpis: OpsDashboardKpis,
): Promise<OpsPendingAction[]> {
  const [returnsTodayRes, manualBookingRes] = await Promise.all([
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('booking_status', ['active', 'confirmed'])
      .eq('return_date', today),
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_status', 'pending_payment'),
  ])

  const returnsToday = readCount('returnsToday', returnsTodayRes)

  const actions: OpsPendingAction[] = [
    {
      id: 'kyc',
      title: 'Pending KYC approvals',
      detail: 'Identity documents awaiting reviewer decision',
      count: kpis.pendingKyc,
      href: '/admin/kyc?filter=pending',
      priority: kpis.pendingKyc > 0 ? 'high' : 'low',
    },
    {
      id: 'payments',
      title: 'Pending payment confirmations',
      detail: `${formatInrShort(kpis.pendingPaymentsRupees)} outstanding across open bookings`,
      count: kpis.pendingPayments,
      href: '/admin/payments',
      priority: kpis.pendingPayments > 0 ? 'high' : 'low',
    },
    {
      id: 'returns',
      title: 'Cars returning today',
      detail: 'Schedule return inspection and deposit review',
      count: returnsToday,
      href: '/admin/bookings?status=active',
      priority: returnsToday > 0 ? 'medium' : 'low',
    },
    {
      id: 'refunds',
      title: 'Refund approvals',
      detail: 'Deposits and balances pending release',
      count: kpis.refundsPending,
      href: '/admin/financials',
      priority: kpis.refundsPending > 0 ? 'high' : 'low',
    },
    {
      id: 'manual',
      title: 'Manual booking confirmations',
      detail: 'Bookings awaiting payment or ops approval',
      count: readCount('manualBooking', manualBookingRes),
      href: '/admin/bookings?status=pending_payment',
      priority: (manualBookingRes.count ?? 0) > 0 ? 'medium' : 'low',
    },
  ]

  return actions.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })
}

function formatInrShort(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

const EMPTY_KPIS: OpsDashboardKpis = {
  totalBookings: 0,
  activeRentals: 0,
  pendingPayments: 0,
  pendingPaymentsRupees: 0,
  monthlyRevenue: 0,
  carsAvailable: 0,
  carsBooked: 0,
  pendingKyc: 0,
  refundsPending: 0,
  refundsPendingRupees: 0,
}

export async function fetchOpsDashboardBundle(role: AppAuthRole): Promise<OpsDashboardBundle> {
  const base = await fetchCommandCenterBundle(role)
  const visibility = base.visibility
  const loadedAt = new Date().toISOString()
  const today = utcTodayYmd()

  if (!hasPermission(role, 'admin.dashboard.read')) {
    return {
      visibility,
      kpis: EMPTY_KPIS,
      liveOperations: [],
      payments: [],
      paymentsSummary: { pendingTotalRupees: 0, collectedTotalRupees: 0, pendingBookingCount: 0 },
      customers: [],
      vehicles: [],
      pendingActions: [],
      loadedAt,
    }
  }

  try {
    const admin = createAdminClient()
    const [kpis, liveOperations, payments, customers, vehicles, paymentMetrics] = await Promise.all([
      fetchKpis(admin, today),
      fetchLiveOperations(admin),
      visibility.finance ? fetchPaymentRows(admin) : Promise.resolve([]),
      hasPermission(role, 'bookings.read') ? fetchCustomers(admin) : Promise.resolve([]),
      visibility.fleet ? fetchVehicles(admin, today) : Promise.resolve([]),
      adminPaymentOperationsMetrics(),
    ])

    const pendingActions = await fetchPendingActions(admin, today, kpis)

    return {
      visibility,
      kpis,
      liveOperations,
      payments,
      paymentsSummary: {
        pendingTotalRupees: paymentMetrics.pendingCollectionRupees,
        collectedTotalRupees: paymentMetrics.collectedRentalRupees,
        pendingBookingCount: paymentMetrics.pendingBookingCount,
      },
      customers,
      vehicles,
      pendingActions,
      loadedAt,
    }
  } catch {
    return {
      visibility,
      kpis: EMPTY_KPIS,
      liveOperations: [],
      payments: [],
      paymentsSummary: { pendingTotalRupees: 0, collectedTotalRupees: 0, pendingBookingCount: 0 },
      customers: [],
      vehicles: [],
      pendingActions: [],
      loadedAt,
    }
  }
}
