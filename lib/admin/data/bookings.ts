import 'server-only'

import { escapeIlikePattern } from '@/lib/admin/bookings-search'
import type { BookingWithCar } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

const bookingSelect = `
  id,
  vehicle_id,
  user_id,
  pickup_date,
  return_date,
  pickup_location,
  return_location,
  rental_days,
  price_per_day_rupees_snapshot,
  subtotal_rupees,
  convenience_fee_rupees,
  gst_rupees,
  total_rupees,
  booking_status,
  payment_status,
  ops_note,
  created_at,
  updated_at,
  vehicles (
    id,
    name,
    brand,
    price_per_day,
    image,
    available,
    transmission,
    fuel_type,
    seats,
    year,
    registration_number,
    security_deposit
  )
`

export type AdminBookingListItem = BookingWithCar & {
  customerEmail: string | null
  customerFullName: string | null
}

export type AdminBookingsListParams = {
  page?: number
  pageSize?: number
  booking_status?: string
  payment_status?: string
  search?: string
}

export type AdminBookingsPageResult = {
  rows: AdminBookingListItem[]
  totalCount: number
  page: number
  pageSize: number
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

function clampPageSize(n: number): number {
  if (PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number])) return n
  return 25
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

  const { data: profileHits } = await admin.from('profiles').select('user_id').ilike('full_name', pat).limit(150)
  const userIdsFromProfiles = [...new Set((profileHits ?? []).map((p) => p.user_id).filter(Boolean))]
  if (userIdsFromProfiles.length) {
    orParts.push(`user_id.in.(${userIdsFromProfiles.join(',')})`)
  }

  const [{ data: vName }, { data: vBrand }] = await Promise.all([
    admin.from('vehicles').select('id').ilike('name', pat).limit(80),
    admin.from('vehicles').select('id').ilike('brand', pat).limit(80),
  ])
  const vehicleIds = [...new Set([...(vName ?? []), ...(vBrand ?? [])].map((v) => v.id).filter(Boolean))]
  if (vehicleIds.length) {
    orParts.push(`vehicle_id.in.(${vehicleIds.join(',')})`)
  }

  return orParts.join(',')
}

/** Paginated admin list with optional booking/payment filters and text search (locations, vehicles, profiles). */
export async function adminListBookingsPage(params: AdminBookingsListParams = {}): Promise<AdminBookingsPageResult> {
  const admin = createAdminClient()
  const pageSize = clampPageSize(Number(params.pageSize) || 25)
  let page = Math.max(1, Math.floor(Number(params.page) || 1))

  const rawSearch = params.search?.trim()
  const orExpr = rawSearch ? await buildBookingSearchOrExpression(admin, rawSearch) : null

  let countQ = admin.from('bookings').select('id', { count: 'exact', head: true })
  if (params.booking_status?.trim()) {
    countQ = countQ.eq('booking_status', params.booking_status.trim())
  }
  if (params.payment_status?.trim()) {
    countQ = countQ.eq('payment_status', params.payment_status.trim())
  }
  if (orExpr) {
    countQ = countQ.or(orExpr)
  }
  const { count: headCount, error: countErr } = await countQ
  const totalCount = countErr ? 0 : typeof headCount === 'number' ? headCount : 0

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  if (page > totalPages) {
    page = totalPages
  }

  let dataQ = admin.from('bookings').select(bookingSelect).order('created_at', { ascending: false })
  if (params.booking_status?.trim()) {
    dataQ = dataQ.eq('booking_status', params.booking_status.trim())
  }
  if (params.payment_status?.trim()) {
    dataQ = dataQ.eq('payment_status', params.payment_status.trim())
  }
  if (orExpr) {
    dataQ = dataQ.or(orExpr)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error } = await dataQ.range(from, to)

  if (error || !data) {
    return { rows: [], totalCount, page, pageSize }
  }

  const base = data as unknown as BookingWithCar[]
  const rows = await adminEnrichBookingsForAdminList(base)
  return {
    rows,
    totalCount,
    page,
    pageSize,
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

  const [{ data: profiles }, ...emailResults] = await Promise.all([
    admin.from('profiles').select('user_id, full_name').in('user_id', uniqueIds),
    ...uniqueIds.map(async (uid) => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(uid)
        if (error || !data?.user) return { uid, email: null as string | null }
        return { uid, email: data.user.email ?? null }
      } catch {
        return { uid, email: null as string | null }
      }
    }),
  ])

  const nameByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name?.trim() || null]))
  const emailByUserId = new Map<string, string | null>()
  for (const r of emailResults) {
    emailByUserId.set(r.uid, r.email)
  }

  return rows.map((r) => ({
    ...r,
    customerEmail: emailByUserId.get(r.user_id) ?? null,
    customerFullName: nameByUserId.get(r.user_id) ?? null,
  }))
}

/** @deprecated Use adminEnrichBookingsForAdminList */
export async function adminEnrichBookingsWithCustomerEmails(rows: BookingWithCar[]): Promise<AdminBookingListItem[]> {
  return adminEnrichBookingsForAdminList(rows)
}

export async function adminGetBooking(id: string): Promise<BookingWithCar | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('bookings').select(bookingSelect).eq('id', id).maybeSingle()

  if (error || !data) return null
  return data as unknown as BookingWithCar
}

export async function adminListBookingsForUser(userId: string): Promise<BookingWithCar[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bookings')
    .select(bookingSelect)
    .eq('user_id', userId)
    .order('pickup_date', { ascending: false })
    .limit(100)

  if (error || !data) return []
  return data as unknown as BookingWithCar[]
}
