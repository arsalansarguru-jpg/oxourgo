import 'server-only'

import { enumerateUtcDays, toUtcYmd, type AnalyticsResolvedRange } from '@/lib/admin/analytics-range'
import { createAdminClient } from '@/lib/supabase/admin'

type BookingLite = {
  id: string
  user_id: string
  vehicle_id: string | null
  created_at: string
  pickup_date: string
  return_date: string
  rental_days: number
  total_rupees: number
  booking_status: string
  payment_status: string
}

type VehicleLite = { id: string; name: string; brand: string; available: boolean | null }

function postedRevenueEligible(b: Pick<BookingLite, 'booking_status' | 'payment_status'>): boolean {
  if ((b.booking_status ?? '').trim().toLowerCase() === 'cancelled') return false
  const p = (b.payment_status ?? '').trim().toLowerCase()
  return p === 'paid' || p === 'authorized'
}

function bookingSuccessForConversion(b: Pick<BookingLite, 'booking_status'>): boolean {
  const s = (b.booking_status ?? '').trim().toLowerCase()
  return s === 'confirmed' || s === 'completed'
}

function overlapsDay(pickup: string, ret: string, day: string): boolean {
  const pu = pickup.slice(0, 10)
  const re = ret.slice(0, 10)
  return pu <= day && re >= day
}

async function sumPostedRevenue(
  admin: ReturnType<typeof createAdminClient>,
  range?: { startIso: string; endIso: string } | { fromMonthStart: true },
) {
  let sum = 0
  const page = 2000
  let from = 0
  for (let guard = 0; guard < 40; guard++) {
    let q = admin
      .from('bookings')
      .select('total_rupees, booking_status, payment_status')
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
      console.error('[adminAnalytics] sumPostedRevenue', error.message)
      break
    }
    const rows = (data ?? []) as Pick<BookingLite, 'total_rupees' | 'booking_status' | 'payment_status'>[]
    for (const r of rows) {
      if (postedRevenueEligible(r)) sum += Number(r.total_rupees ?? 0)
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
  vehicle_label: string | null
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
    activeBookings: number
    fleetUtilizationPct: number
    pendingKyc: number
    totalCustomers: number
    conversionPct: number
    bookingsCreatedInPeriod: number
  }
  series: {
    revenueByDay: AdminAnalyticsSeriesPoint[]
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

export async function fetchAdminAnalyticsBundle(range: AnalyticsResolvedRange): Promise<AdminAnalyticsBundle> {
  const admin = createAdminClient()
  const today = toUtcYmd(new Date())

  const days = enumerateUtcDays(range.startDay, range.endDay)
  const daySet = new Set(days)

  const [
    vehiclesRes,
    profilesCountRes,
    pendingKycRes,
    activeBookingsRes,
    profilesGrowthRes,
    totalRevenueLifetime,
    monthlyRevenue,
  ] = await Promise.all([
    admin.from('vehicles').select('id, name, brand, available'),
    admin.from('profiles').select('user_id', { count: 'exact', head: true }),
    admin.from('kyc_documents').select('id', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('booking_status', ['confirmed', 'pending_payment'])
      .not('vehicle_id', 'is', null)
      .lte('pickup_date', today)
      .gte('return_date', today),
    admin
      .from('profiles')
      .select('created_at')
      .gte('created_at', range.startIso)
      .lte('created_at', range.endIso)
      .limit(8000),
    sumPostedRevenue(admin),
    sumPostedRevenue(admin, { fromMonthStart: true }),
  ])

  const vehicles = (vehiclesRes.data ?? []) as VehicleLite[]
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]))
  const bookableIds = new Set(vehicles.filter((v) => v.available !== false).map((v) => v.id))
  const bookableCount = bookableIds.size

  const totalCustomers = typeof profilesCountRes.count === 'number' ? profilesCountRes.count : 0
  const pendingKyc = typeof pendingKycRes.count === 'number' ? pendingKycRes.count : 0
  const activeBookings = typeof activeBookingsRes.count === 'number' ? activeBookingsRes.count : 0

  const allInRange: BookingLite[] = []
  let truncatedBookings = false
  for (let off = 0, guard = 0; guard < 32; guard++) {
    const { data, error } = await admin
      .from('bookings')
      .select(
        'id, user_id, vehicle_id, created_at, pickup_date, return_date, rental_days, total_rupees, booking_status, payment_status',
      )
      .gte('created_at', range.startIso)
      .lte('created_at', range.endIso)
      .order('created_at', { ascending: true })
      .range(off, off + BOOKING_PAGE - 1)

    if (error) {
      console.error('[fetchAdminAnalyticsBundle] bookings page', error.message)
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

  /** Trips overlapping the chart window (for fleet availability / utilization). */
  const overlapBookings: BookingLite[] = []
  let truncatedOverlap = false
  for (let off = 0, guard = 0; guard < 32; guard++) {
    const { data, error } = await admin
      .from('bookings')
      .select(
        'id, user_id, vehicle_id, created_at, pickup_date, return_date, rental_days, total_rupees, booking_status, payment_status',
      )
      .lte('pickup_date', range.endDay)
      .gte('return_date', range.startDay)
      .order('pickup_date', { ascending: true })
      .range(off, off + BOOKING_PAGE - 1)
    if (error) {
      console.error('[fetchAdminAnalyticsBundle] overlap bookings', error.message)
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
  let bookingsCreatedInPeriod = 0
  let conversionSuccess = 0
  const revenueByDay = new Map<string, number>()
  const bookingsByDay = new Map<string, number>()
  for (const d of days) {
    revenueByDay.set(d, 0)
    bookingsByDay.set(d, 0)
  }

  for (const b of allInRange) {
    bookingsCreatedInPeriod += 1
    if (bookingSuccessForConversion(b)) conversionSuccess += 1
    if (postedRevenueEligible(b)) {
      periodRevenue += Number(b.total_rupees ?? 0)
      const day = b.created_at.slice(0, 10)
      if (daySet.has(day)) revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(b.total_rupees ?? 0))
    }
    const day = b.created_at.slice(0, 10)
    if (daySet.has(day)) bookingsByDay.set(day, (bookingsByDay.get(day) ?? 0) + 1)
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
        if (b.booking_status.trim().toLowerCase() === 'cancelled') continue
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
    if (b.vehicle_id) {
      const cur = vehicleRevenue.get(b.vehicle_id) ?? { bookings: 0, revenue: 0 }
      cur.bookings += 1
      if (postedRevenueEligible(b)) cur.revenue += Number(b.total_rupees ?? 0)
      vehicleRevenue.set(b.vehicle_id, cur)
    }
    if (postedRevenueEligible(b)) {
      userRevenue.set(b.user_id, (userRevenue.get(b.user_id) ?? 0) + Number(b.total_rupees ?? 0))
    }
  }

  const topVehicleIds = [...vehicleRevenue.entries()]
    .sort((a, b) => b[1].bookings - a[1].bookings)
    .slice(0, 8)
    .map(([id]) => id)

  const topUserIds = [...userRevenue.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id)

  let profileNames = new Map<string, string | null>()
  if (topUserIds.length) {
    const { data: profs } = await admin.from('profiles').select('user_id, full_name').in('user_id', topUserIds)
    profileNames = new Map(
      (profs ?? []).map((p: { user_id: string; full_name: string | null }) => [p.user_id, p.full_name]),
    )
  }

  const topVehicles: AdminAnalyticsTopVehicle[] = topVehicleIds.map((vid) => {
    const agg = vehicleRevenue.get(vid)!
    const v = vehicleMap.get(vid)
    const label = v ? `${v.brand} ${v.name}`.trim() : vid.slice(0, 8)
    return { vehicle_id: vid, bookings: agg.bookings, revenue: agg.revenue, label }
  })

  const topCustomers: AdminAnalyticsTopCustomer[] = topUserIds.map((uid) => ({
    user_id: uid,
    revenue: userRevenue.get(uid) ?? 0,
    full_name: profileNames.get(uid) ?? null,
  }))

  const recentSource = [...allInRange]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12)
  const recentBookings: AdminAnalyticsRecentBooking[] = recentSource.map((b) => {
    const v = b.vehicle_id ? vehicleMap.get(b.vehicle_id) : undefined
    const vehicle_label = v ? `${v.brand} ${v.name}`.trim() : null
    return {
      id: b.id,
      created_at: b.created_at,
      pickup_date: b.pickup_date,
      return_date: b.return_date,
      total_rupees: b.total_rupees,
      booking_status: b.booking_status,
      payment_status: b.payment_status,
      vehicle_label,
      user_id: b.user_id,
    }
  })

  return {
    range,
    truncatedBookings,
    totals: {
      totalRevenueLifetime,
      monthlyRevenue,
      periodRevenue,
      activeBookings,
      fleetUtilizationPct,
      pendingKyc,
      totalCustomers,
      conversionPct,
      bookingsCreatedInPeriod,
    },
    series: {
      revenueByDay: days.map((d) => ({ date: d, value: revenueByDay.get(d) ?? 0 })),
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
