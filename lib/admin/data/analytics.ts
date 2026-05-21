import 'server-only'

import {
  bookingCollectedRupees,
  bookingContractRupees,
  bookingPendingRupees,
  hasCollectedPayment,
  isBookingCancelled,
  type BookingFinancialRow,
} from '@/lib/admin/booking-financials'
import { enumerateUtcDays, toUtcYmd, type AnalyticsResolvedRange } from '@/lib/admin/analytics-range'
import { fleetCatalogTitle } from '@/lib/admin/fleet-display'
import { resolveCustomerDisplayName, type CustomerNameInput } from '@/lib/customer/display-name'
import { logAdminQueryResult } from '@/lib/admin/debug-query'
import { countPendingKycCustomers } from '@/lib/admin/kyc-metrics'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'
import { adminViolationMetrics } from '@/lib/admin/data/violations'

type BookingLite = BookingFinancialRow & {
  id: string
  user_id: string
  vehicle_id: string | null
  created_at: string
  pickup_date: string
  return_date: string
  rental_days: number
  booking_status: string
}

type VehicleLite = { id: string; name: string; brand: string; registration_number?: string | null; available: boolean | null }

function bookingSuccessForConversion(b: Pick<BookingLite, 'booking_status'>): boolean {
  const s = (b.booking_status ?? '').trim().toLowerCase()
  return s === 'confirmed' || s === 'active' || s === 'completed'
}

function overlapsDay(pickup: string, ret: string, day: string): boolean {
  const pu = pickup.slice(0, 10)
  const re = ret.slice(0, 10)
  return pu <= day && re >= day
}

async function sumBookingFinancials(
  admin: ReturnType<typeof createAdminClient>,
  mode: 'collected' | 'booked',
  range?: { startIso: string; endIso: string } | { fromMonthStart: true },
) {
  let sum = 0
  const page = 2000
  let from = 0
  for (let guard = 0; guard < 40; guard++) {
    let q = admin
      .from('bookings')
      .select('total_rupees, booking_status, payment_status, amount_paid, amount_due')
      .is('deleted_at', null)
      .not('booking_status', 'eq', 'cancelled')
      .range(from, from + page - 1)
    if (range && 'startIso' in range) {
      q = q.gte('created_at', range.startIso).lte('created_at', range.endIso)
    } else if (range && 'fromMonthStart' in range) {
      const y = new Date().getUTCFullYear()
      const m = new Date().getUTCMonth()
      const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)).toISOString()
      q = q.gte('created_at', start)
    }
    const { data, error } = await q
    if (error) {
      logPostgrestError(`[adminAnalytics] sumBookingFinancials:${mode}`, error)
      break
    }
    const rows = (data ?? []) as BookingLite[]
    for (const r of rows) {
      sum += mode === 'collected' ? bookingCollectedRupees(r) : bookingContractRupees(r)
    }
    if (rows.length < page) break
    from += page
  }
  return sum
}

export type AdminAnalyticsSeriesPoint = { date: string; value: number }

export type AdminAnalyticsRecentBooking = {
  id: string
  created_at: string
  pickup_date: string
  return_date: string
  total_rupees: number
  booking_status: string
  payment_status: string
  vehicle_label: string
  user_id: string
}

export type AdminAnalyticsTopCustomer = {
  user_id: string
  revenue: number
  full_name: string | null
}

export type AdminAnalyticsTopVehicle = {
  vehicle_id: string
  bookings: number
  revenue: number
  label: string
}

export type AdminAnalyticsBundle = {
  range: AnalyticsResolvedRange
  truncatedBookings: boolean
  totals: {
    totalRevenueLifetime: number
    monthlyRevenue: number
    periodRevenue: number
    periodBookedValue: number
    periodPendingRupees: number
    activeBookings: number
    fleetUtilizationPct: number
    pendingKyc: number
    totalCustomers: number
    conversionPct: number
    bookingsCreatedInPeriod: number
    finesCollectedRupees: number
    outstandingFinesRupees: number
    openViolationsCount: number
  }
  series: {
    revenueByDay: AdminAnalyticsSeriesPoint[]
    bookedValueByDay: AdminAnalyticsSeriesPoint[]
    bookingsByDay: AdminAnalyticsSeriesPoint[]
    fleetAvailabilityByDay: AdminAnalyticsSeriesPoint[]
    newCustomersByDay: AdminAnalyticsSeriesPoint[]
  }
  tables: {
    recentBookings: AdminAnalyticsRecentBooking[]
    topCustomers: AdminAnalyticsTopCustomer[]
    topVehicles: AdminAnalyticsTopVehicle[]
  }
}

const BOOKING_PAGE = 4000

function vehicleLabel(v: VehicleLite | undefined, vehicleId: string | null): string {
  if (!v) return vehicleId ? `Unit ${vehicleId.slice(0, 8).toUpperCase()}` : 'Unknown unit'
  return fleetCatalogTitle({
    id: v.id,
    name: v.name,
    brand: v.brand,
    registration_number: v.registration_number ?? null,
  })
}

export async function fetchAdminAnalyticsBundle(range: AnalyticsResolvedRange): Promise<AdminAnalyticsBundle> {
  const admin = createAdminClient()
  const today = toUtcYmd(new Date())

  const days = enumerateUtcDays(range.startDay, range.endDay)
  const daySet = new Set(days)

  const [
    vehiclesRes,
    profilesCountRes,
    pendingKycCount,
    activeBookingsRes,
    profilesGrowthRes,
    totalRevenueLifetime,
    monthlyRevenue,
    violationMetrics,
  ] = await Promise.all([
    admin.from('vehicles').select('id, name, brand, registration_number, available').is('deleted_at', null),
    admin.from('profiles').select('user_id', { count: 'exact', head: true }),
    countPendingKycCustomers(),
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('booking_status', ['confirmed', 'pending_payment', 'active'])
      .not('vehicle_id', 'is', null)
      .is('deleted_at', null)
      .lte('pickup_date', today)
      .gte('return_date', today),
    admin
      .from('profiles')
      .select('created_at')
      .gte('created_at', range.startIso)
      .lte('created_at', range.endIso)
      .limit(8000),
    sumBookingFinancials(admin, 'collected'),
    sumBookingFinancials(admin, 'collected', { fromMonthStart: true }),
    adminViolationMetrics(),
  ])

  if (vehiclesRes.error) logPostgrestError('[fetchAdminAnalyticsBundle] vehicles', vehiclesRes.error)
  if (profilesCountRes.error) logPostgrestError('[fetchAdminAnalyticsBundle] profilesCount', profilesCountRes.error)
  if (activeBookingsRes.error) logPostgrestError('[fetchAdminAnalyticsBundle] activeBookingsCount', activeBookingsRes.error)
  if (profilesGrowthRes.error) logPostgrestError('[fetchAdminAnalyticsBundle] profilesGrowth', profilesGrowthRes.error)

  const vehicles = (vehiclesRes.data ?? []) as VehicleLite[]
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]))
  const bookableIds = new Set(vehicles.filter((v) => v.available !== false).map((v) => v.id))
  const bookableCount = bookableIds.size

  const totalCustomers = typeof profilesCountRes.count === 'number' ? profilesCountRes.count : 0
  const pendingKyc = pendingKycCount
  const activeBookings = typeof activeBookingsRes.count === 'number' ? activeBookingsRes.count : 0

  const allInRange: BookingLite[] = []
  let truncatedBookings = false
  for (let off = 0, guard = 0; guard < 32; guard++) {
    const { data, error } = await admin
      .from('bookings')
      .select(
        'id, user_id, vehicle_id, created_at, pickup_date, return_date, rental_days, total_rupees, booking_status, payment_status, amount_paid, amount_due',
      )
      .gte('created_at', range.startIso)
      .lte('created_at', range.endIso)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(off, off + BOOKING_PAGE - 1)

    if (error) {
      logPostgrestError('[fetchAdminAnalyticsBundle] bookings page', error)
      break
    }
    const chunk = (data ?? []) as BookingLite[]
    allInRange.push(...chunk)
    if (chunk.length < BOOKING_PAGE) break
    off += BOOKING_PAGE
    if (off >= BOOKING_PAGE * 8) {
      truncatedBookings = true
      break
    }
  }

  logAdminQueryResult('fetchAdminAnalyticsBundle.bookingsInRange', {
    rowCount: allInRange.length,
    meta: { truncatedBookings, startIso: range.startIso, endIso: range.endIso },
  })

  const overlapBookings: BookingLite[] = []
  let truncatedOverlap = false
  for (let off = 0, guard = 0; guard < 32; guard++) {
    const { data, error } = await admin
      .from('bookings')
      .select(
        'id, user_id, vehicle_id, created_at, pickup_date, return_date, rental_days, total_rupees, booking_status, payment_status, amount_paid, amount_due',
      )
      .lte('pickup_date', range.endDay)
      .gte('return_date', range.startDay)
      .is('deleted_at', null)
      .order('pickup_date', { ascending: true })
      .range(off, off + BOOKING_PAGE - 1)
    if (error) {
      logPostgrestError('[fetchAdminAnalyticsBundle] overlap bookings', error)
      break
    }
    const chunk = (data ?? []) as BookingLite[]
    overlapBookings.push(...chunk)
    if (chunk.length < BOOKING_PAGE) break
    off += BOOKING_PAGE
    if (off >= BOOKING_PAGE * 8) {
      truncatedOverlap = true
      break
    }
  }
  truncatedBookings = truncatedBookings || truncatedOverlap

  let periodRevenue = 0
  let periodBookedValue = 0
  let periodPendingRupees = 0
  let bookingsCreatedInPeriod = 0
  let conversionSuccess = 0
  const revenueByDay = new Map<string, number>()
  const bookedValueByDay = new Map<string, number>()
  const bookingsByDay = new Map<string, number>()
  for (const d of days) {
    revenueByDay.set(d, 0)
    bookedValueByDay.set(d, 0)
    bookingsByDay.set(d, 0)
  }

  for (const b of allInRange) {
    const day = b.created_at.slice(0, 10)
    if (!daySet.has(day)) continue
    if (isBookingCancelled(b.booking_status)) continue

    bookingsCreatedInPeriod += 1
    if (bookingSuccessForConversion(b)) conversionSuccess += 1
    bookingsByDay.set(day, (bookingsByDay.get(day) ?? 0) + 1)

    const collected = bookingCollectedRupees(b)
    const contract = bookingContractRupees(b)
    periodRevenue += collected
    periodBookedValue += contract
    periodPendingRupees += bookingPendingRupees(b)
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + collected)
    bookedValueByDay.set(day, (bookedValueByDay.get(day) ?? 0) + contract)
  }

  const conversionPct =
    bookingsCreatedInPeriod === 0 ? 0 : Math.round((conversionSuccess / bookingsCreatedInPeriod) * 1000) / 10

  const fleetAvailabilityByDay: AdminAnalyticsSeriesPoint[] = []
  if (bookableCount === 0) {
    for (const d of days) fleetAvailabilityByDay.push({ date: d, value: 0 })
  } else {
    for (const d of days) {
      const onTrip = new Set<string>()
      for (const b of overlapBookings) {
        if (isBookingCancelled(b.booking_status)) continue
        if (!b.vehicle_id) continue
        if (!bookableIds.has(b.vehicle_id)) continue
        if (overlapsDay(b.pickup_date, b.return_date, d)) onTrip.add(b.vehicle_id)
      }
      const pct = Math.max(0, Math.min(100, Math.round(((bookableCount - onTrip.size) / bookableCount) * 100)))
      fleetAvailabilityByDay.push({ date: d, value: pct })
    }
  }

  const newCustomersByDay = new Map<string, number>()
  for (const d of days) newCustomersByDay.set(d, 0)
  for (const row of (profilesGrowthRes.data ?? []) as { created_at: string }[]) {
    const day = row.created_at.slice(0, 10)
    if (daySet.has(day)) newCustomersByDay.set(day, (newCustomersByDay.get(day) ?? 0) + 1)
  }

  let utilSum = 0
  let utilN = 0
  for (const pt of fleetAvailabilityByDay) {
    utilSum += bookableCount === 0 ? 0 : 100 - pt.value
    utilN += 1
  }
  const fleetUtilizationPct = utilN === 0 ? 0 : Math.round((utilSum / utilN) * 10) / 10

  const vehicleRevenue = new Map<string, { bookings: number; revenue: number }>()
  const userRevenue = new Map<string, number>()

  for (const b of allInRange) {
    if (isBookingCancelled(b.booking_status)) continue
    const rev = hasCollectedPayment(b) ? bookingCollectedRupees(b) : bookingContractRupees(b)
    if (b.vehicle_id) {
      const cur = vehicleRevenue.get(b.vehicle_id) ?? { bookings: 0, revenue: 0 }
      cur.bookings += 1
      cur.revenue += rev
      vehicleRevenue.set(b.vehicle_id, cur)
    }
    userRevenue.set(b.user_id, (userRevenue.get(b.user_id) ?? 0) + rev)
  }

  const topVehicleIds = [...vehicleRevenue.entries()]
    .sort((a, b) => b[1].bookings - a[1].bookings)
    .slice(0, 8)
    .map(([id]) => id)

  const topUserIds = [...userRevenue.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id)

  const profileNames = new Map<string, string | null>()
  if (topUserIds.length) {
    const { data: profs } = await admin
      .from('profiles')
      .select('user_id, full_name, phone')
      .in('user_id', topUserIds)
    const profById = new Map((profs ?? []).map((p) => [p.user_id, p]))
    await Promise.all(
      topUserIds.map(async (uid) => {
        const prof = profById.get(uid)
        let email: string | null = null
        let meta: CustomerNameInput['authMetadata'] = null
        try {
          const { data: authUser } = await admin.auth.admin.getUserById(uid)
          email = authUser?.user?.email ?? null
          const raw = authUser?.user?.user_metadata
          if (raw && typeof raw === 'object') {
            meta = {
              full_name: typeof raw.full_name === 'string' ? raw.full_name : undefined,
              name: typeof raw.name === 'string' ? raw.name : undefined,
              display_name: typeof raw.display_name === 'string' ? raw.display_name : undefined,
            }
          }
        } catch {
          /* non-fatal */
        }
        profileNames.set(
          uid,
          resolveCustomerDisplayName({
            userId: uid,
            fullName: prof?.full_name ?? null,
            email,
            phone: (prof as { phone?: string | null } | undefined)?.phone ?? null,
            authMetadata: meta,
          }),
        )
      }),
    )
  }

  const topVehicles: AdminAnalyticsTopVehicle[] = topVehicleIds.map((vid) => {
    const agg = vehicleRevenue.get(vid)!
    return {
      vehicle_id: vid,
      bookings: agg.bookings,
      revenue: agg.revenue,
      label: vehicleLabel(vehicleMap.get(vid), vid),
    }
  })

  const topCustomers: AdminAnalyticsTopCustomer[] = topUserIds.map((uid) => ({
    user_id: uid,
    revenue: userRevenue.get(uid) ?? 0,
    full_name: profileNames.get(uid) ?? null,
  }))

  const recentSource = allInRange.slice(0, 12)
  const recentBookings: AdminAnalyticsRecentBooking[] = recentSource.map((b) => ({
    id: b.id,
    created_at: b.created_at,
    pickup_date: b.pickup_date,
    return_date: b.return_date,
    total_rupees: b.total_rupees ?? 0,
    booking_status: b.booking_status,
    payment_status: b.payment_status ?? 'pending',
    vehicle_label: vehicleLabel(b.vehicle_id ? vehicleMap.get(b.vehicle_id) : undefined, b.vehicle_id),
    user_id: b.user_id,
  }))

  return {
    range,
    truncatedBookings,
    totals: {
      totalRevenueLifetime,
      monthlyRevenue,
      periodRevenue,
      periodBookedValue,
      periodPendingRupees,
      activeBookings,
      fleetUtilizationPct,
      pendingKyc,
      totalCustomers,
      conversionPct,
      bookingsCreatedInPeriod,
      finesCollectedRupees: violationMetrics.totalFinesCollectedRupees,
      outstandingFinesRupees: violationMetrics.outstandingLiabilitiesRupees,
      openViolationsCount: violationMetrics.openViolationsCount,
    },
    series: {
      revenueByDay: days.map((d) => ({ date: d, value: revenueByDay.get(d) ?? 0 })),
      bookedValueByDay: days.map((d) => ({ date: d, value: bookedValueByDay.get(d) ?? 0 })),
      bookingsByDay: days.map((d) => ({ date: d, value: bookingsByDay.get(d) ?? 0 })),
      fleetAvailabilityByDay,
      newCustomersByDay: days.map((d) => ({ date: d, value: newCustomersByDay.get(d) ?? 0 })),
    },
    tables: {
      recentBookings,
      topCustomers,
      topVehicles,
    },
  }
}
