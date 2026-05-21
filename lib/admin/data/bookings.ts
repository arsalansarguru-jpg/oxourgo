import 'server-only'

import { escapeIlikePattern } from '@/lib/admin/bookings-search'
import { resolveCustomerDisplayName, type CustomerNameInput } from '@/lib/customer/display-name'
import { logAdminQueryResult } from '@/lib/admin/debug-query'
import {
  BOOKING_SELECT_TIERS,
  normalizeBookingRow,
  type BookingRowLike,
} from '@/lib/supabase/booking-select'
import type { BookingWithCar, VehicleSummaryRow } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type AdminBookingListItem = BookingWithCar & {
  customerEmail: string | null
  customerFullName: string | null
}

export type AdminBookingsListParams = {
  page?: number
  pageSize?: number
  booking_status?: string
  payment_status?: string
  booking_source?: string
  search?: string
}

export type AdminBookingsPageResult = {
  rows: AdminBookingListItem[]
  totalCount: number
  page: number
  pageSize: number
  dataError: string | null
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

function clampPageSize(n: number): number {
  if (PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number])) return n
  return 25
}

function asBookingWithCar(row: BookingRowLike): BookingWithCar {
  return normalizeBookingRow(row) as unknown as BookingWithCar
}

async function buildBookingSearchOrExpression(
  admin: ReturnType<typeof createAdminClient>,
  rawSearch: string,
): Promise<string> {
  const pat = `%${escapeIlikePattern(rawSearch)}%`
  const orParts: string[] = [`pickup_location.ilike.${pat}`, `return_location.ilike.${pat}`]

  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (uuidRe.test(rawSearch)) {
    orParts.push(`user_id.eq.${rawSearch}`)
    orParts.push(`id.eq.${rawSearch}`)
    orParts.push(`vehicle_id.eq.${rawSearch}`)
  }

  const { data: profileHits, error: profileSearchErr } = await admin
    .from('profiles')
    .select('user_id')
    .ilike('full_name', pat)
    .limit(150)
  if (profileSearchErr) {
    logPostgrestError('[buildBookingSearchOrExpression] profiles', profileSearchErr)
  }
  const userIdsFromProfiles = [...new Set((profileHits ?? []).map((p) => p.user_id).filter(Boolean))]
  if (userIdsFromProfiles.length) {
    orParts.push(`user_id.in.(${userIdsFromProfiles.join(',')})`)
  }

  const [{ data: vName, error: vNameErr }, { data: vBrand, error: vBrandErr }] = await Promise.all([
    admin.from('vehicles').select('id').ilike('name', pat).limit(80),
    admin.from('vehicles').select('id').ilike('brand', pat).limit(80),
  ])
  if (vNameErr) logPostgrestError('[buildBookingSearchOrExpression] vehicles.name', vNameErr)
  if (vBrandErr) logPostgrestError('[buildBookingSearchOrExpression] vehicles.brand', vBrandErr)
  const vehicleIds = [...new Set([...(vName ?? []), ...(vBrand ?? [])].map((v) => v.id).filter(Boolean))]
  if (vehicleIds.length) {
    orParts.push(`vehicle_id.in.(${vehicleIds.join(',')})`)
  }

  return orParts.join(',')
}

async function attachVehiclesToBookings(
  admin: ReturnType<typeof createAdminClient>,
  rows: BookingWithCar[],
): Promise<BookingWithCar[]> {
  const vehicleIds = [...new Set(rows.map((r) => r.vehicle_id).filter((id): id is string => Boolean(id)))]
  if (!vehicleIds.length) return rows

  const { data: vehicles, error } = await admin
    .from('vehicles')
    .select('id, name, brand, price_per_day, image, available, transmission, fuel_type, seats, year, registration_number, security_deposit')
    .in('id', vehicleIds)
    .is('deleted_at', null)

  if (error) {
    logPostgrestError('[attachVehiclesToBookings]', error)
    return rows
  }

  const byId = new Map((vehicles ?? []).map((v) => [v.id, v as VehicleSummaryRow]))
  return rows.map((r) => ({
    ...r,
    vehicles: r.vehicle_id ? (byId.get(r.vehicle_id) ?? null) : null,
  }))
}

function needsVehicleAttach(select: string): boolean {
  return !select.includes('vehicles!')
}

async function fetchBookingRowsForPage(
  admin: ReturnType<typeof createAdminClient>,
  params: AdminBookingsListParams,
  orExpr: string | null,
  from: number,
  to: number,
): Promise<{ rows: BookingWithCar[]; dataError: string | null }> {
  const runSelect = async (select: string) => {
    let q = admin.from('bookings').select(select).is('deleted_at', null).order('created_at', { ascending: false })
    if (params.booking_status?.trim()) q = q.eq('booking_status', params.booking_status.trim())
    if (params.payment_status?.trim()) q = q.eq('payment_status', params.payment_status.trim())
    if (params.booking_source?.trim()) q = q.eq('booking_source', params.booking_source.trim())
    if (orExpr) q = q.or(orExpr)
    return q.range(from, to)
  }

  let lastError: { message?: string } | null = null
  for (const tier of BOOKING_SELECT_TIERS) {
    const { data, error } = await runSelect(tier)
    if (!error && data) {
      let rows = (data as unknown as BookingRowLike[]).map(asBookingWithCar)
      if (needsVehicleAttach(tier)) {
        rows = await attachVehiclesToBookings(admin, rows)
      }
      return { rows, dataError: null }
    }
    lastError = error
    logPostgrestError(`[adminListBookingsPage] tier failed`, error)
  }

  return {
    rows: [],
    dataError: lastError?.message ?? 'Unable to load booking rows — run production_schema_alignment migration',
  }
}

async function fetchBookingsByUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  orderCol: 'pickup_date' | 'created_at',
  limit: number,
): Promise<BookingWithCar[]> {
  let lastError: { message?: string } | null = null
  for (const tier of BOOKING_SELECT_TIERS) {
    const { data, error } = await admin
      .from('bookings')
      .select(tier)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order(orderCol, { ascending: false })
      .limit(limit)

    if (!error && data) {
      let rows = (data as unknown as BookingRowLike[]).map(asBookingWithCar)
      if (needsVehicleAttach(tier)) {
        rows = await attachVehiclesToBookings(admin, rows)
      }
      return rows
    }
    lastError = error
    logPostgrestError('[fetchBookingsByUser] tier', error)
  }

  logAdminQueryResult('adminListBookingsForUser', { rowCount: 0, error: lastError })
  return []
}

/** Paginated admin list with optional booking/payment filters and text search (locations, vehicles, profiles). */
export async function adminListBookingsPage(params: AdminBookingsListParams = {}): Promise<AdminBookingsPageResult> {
  const admin = createAdminClient()
  const pageSize = clampPageSize(Number(params.pageSize) || 25)
  let page = Math.max(1, Math.floor(Number(params.page) || 1))

  const rawSearch = params.search?.trim()
  const orExpr = rawSearch ? await buildBookingSearchOrExpression(admin, rawSearch) : null

  let countQ = admin.from('bookings').select('id', { count: 'exact', head: true }).is('deleted_at', null)
  if (params.booking_status?.trim()) countQ = countQ.eq('booking_status', params.booking_status.trim())
  if (params.payment_status?.trim()) countQ = countQ.eq('payment_status', params.payment_status.trim())
  if (params.booking_source?.trim()) countQ = countQ.eq('booking_source', params.booking_source.trim())
  if (orExpr) countQ = countQ.or(orExpr)
  const { count: headCount, error: countErr } = await countQ
  if (countErr) {
    logPostgrestError('[adminListBookingsPage] count', countErr)
  }
  const totalCount = countErr ? 0 : typeof headCount === 'number' ? headCount : 0
  logAdminQueryResult('adminListBookingsPage.count', { totalCount, error: countErr })

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  if (page > totalPages) {
    page = totalPages
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { rows: base, dataError } = await fetchBookingRowsForPage(admin, params, orExpr, from, to)
  logAdminQueryResult('adminListBookingsPage.data', {
    rowCount: base.length,
    totalCount,
    error: dataError ? { message: dataError } : null,
  })

  const rows = await adminEnrichBookingsForAdminList(base)
  return {
    rows,
    totalCount,
    page,
    pageSize,
    dataError,
  }
}

export async function adminListBookings(options?: { booking_status?: string }): Promise<AdminBookingListItem[]> {
  const { rows } = await adminListBookingsPage({
    page: 1,
    pageSize: 100,
    booking_status: options?.booking_status,
  })
  return rows
}

/** Resolves auth email + profile display name for rows (typically one page). */
export async function adminEnrichBookingsForAdminList(rows: BookingWithCar[]): Promise<AdminBookingListItem[]> {
  if (rows.length === 0) return []

  const admin = createAdminClient()
  const uniqueIds = [...new Set(rows.map((r) => r.user_id))]

  const [{ data: profiles, error: profilesErr }, ...emailResults] = await Promise.all([
    admin.from('profiles').select('user_id, full_name, phone').in('user_id', uniqueIds),
    ...uniqueIds.map(async (uid) => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(uid)
        if (error || !data?.user) return { uid, email: null as string | null, meta: null as Record<string, string> | null }
        const meta = data.user.user_metadata as {
          full_name?: string
          name?: string
          display_name?: string
        } | undefined
        return { uid, email: data.user.email ?? null, meta: meta ?? null }
      } catch {
        return { uid, email: null, meta: null }
      }
    }),
  ])

  if (profilesErr) {
    logPostgrestError('[adminEnrichBookingsForAdminList] profiles', profilesErr)
  }

  const profileByUserId = new Map(
    (profiles ?? []).map((p) => [
      p.user_id,
      { full_name: p.full_name?.trim() || null, phone: (p as { phone?: string | null }).phone?.trim() || null },
    ]),
  )
  const emailByUserId = new Map<string, string | null>()
  const metaByUserId = new Map<string, CustomerNameInput['authMetadata']>()
  for (const r of emailResults) {
    emailByUserId.set(r.uid, r.email)
    metaByUserId.set(r.uid, r.meta)
  }

  return rows.map((r) => {
    const prof = profileByUserId.get(r.user_id)
    const email = emailByUserId.get(r.user_id) ?? null
    return {
      ...r,
      customerEmail: email,
      customerFullName: resolveCustomerDisplayName({
        userId: r.user_id,
        fullName: prof?.full_name ?? null,
        email,
        phone: prof?.phone ?? null,
        authMetadata: metaByUserId.get(r.user_id) ?? null,
      }),
    }
  })
}

export async function adminGetBooking(id: string): Promise<BookingWithCar | null> {
  const admin = createAdminClient()
  for (const tier of BOOKING_SELECT_TIERS) {
    const { data, error } = await admin
      .from('bookings')
      .select(tier)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle()

    if (!error && data) {
      let row = asBookingWithCar(data as unknown as BookingRowLike)
      if (needsVehicleAttach(tier)) {
        const [one] = await attachVehiclesToBookings(admin, [row])
        row = one ?? row
      }
      return row
    }
    if (error) logPostgrestError('[adminGetBooking] tier', error)
  }
  return null
}

export async function adminListBookingsForUser(userId: string): Promise<BookingWithCar[]> {
  const admin = createAdminClient()
  const rows = await fetchBookingsByUser(admin, userId, 'pickup_date', 100)
  logAdminQueryResult('adminListBookingsForUser', { rowCount: rows.length, error: null })
  return rows
}

export type AdminBookingCustomerProfile = {
  full_name: string | null
  phone: string | null
  kyc_status: string
}

export async function adminGetBookingCustomerProfile(userId: string): Promise<AdminBookingCustomerProfile | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('full_name, phone, kyc_status')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    logPostgrestError('[adminGetBookingCustomerProfile]', error)
    return null
  }
  if (!data) return null
  return {
    full_name: data.full_name ?? null,
    phone: data.phone ?? null,
    kyc_status: data.kyc_status ?? 'not_started',
  }
}
