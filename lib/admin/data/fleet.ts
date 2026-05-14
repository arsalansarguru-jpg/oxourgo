import 'server-only'

import { escapeIlikePattern } from '@/lib/admin/bookings-search'
import type { Database } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminVehicleRow = Database['public']['Tables']['vehicles']['Row']

export type AdminFleetDashboardMetrics = {
  totalVehicles: number
  availableVehicles: number
  featuredVehicles: number
  avgPricePerDay: number | null
  /** Distinct catalog vehicles with an overlapping active booking (today, UTC date). */
  vehiclesOnTripToday: number
  /** Share of bookable vehicles currently on trip (0–100). */
  bookableUtilizationPercent: number
}

export type AdminFleetListParams = {
  page?: number
  pageSize?: number
  search?: string
  /** all | bookable | offline */
  availability?: string
  /** all | yes | no */
  featured?: string
}

export type AdminFleetPageResult = {
  rows: AdminVehicleRow[]
  totalCount: number
  page: number
  pageSize: number
}

const PAGE_SIZE_OPTIONS = [12, 24, 36, 48] as const

function clampFleetPageSize(n: number): number {
  if (PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number])) return n
  return 12
}

function applyFleetListFilters(
  admin: ReturnType<typeof createAdminClient>,
  params: AdminFleetListParams,
  mode: 'count' | 'data',
) {
  let q =
    mode === 'count'
      ? admin.from('vehicles').select('id', { count: 'exact', head: true })
      : admin.from('vehicles').select('*').order('created_at', { ascending: false })

  const avail = params.availability?.trim() || 'all'
  if (avail === 'bookable') {
    q = q.or('available.is.null,available.eq.true')
  } else if (avail === 'offline') {
    q = q.eq('available', false)
  }

  const feat = params.featured?.trim() || 'all'
  if (feat === 'yes') q = q.eq('featured', true)
  if (feat === 'no') q = q.eq('featured', false)

  const rawSearch = params.search?.trim()
  if (rawSearch) {
    const pat = `%${escapeIlikePattern(rawSearch)}%`
    q = q.or(`brand.ilike.${pat},name.ilike.${pat},registration_number.ilike.${pat},city.ilike.${pat}`)
  }

  return q
}

/** Paginated fleet catalog for admin (search + availability + featured). */
export async function adminListVehiclesPage(params: AdminFleetListParams = {}): Promise<AdminFleetPageResult> {
  const admin = createAdminClient()
  const pageSize = clampFleetPageSize(Number(params.pageSize) || 12)
  let page = Math.max(1, Math.floor(Number(params.page) || 1))

  const countQ = applyFleetListFilters(admin, params, 'count')
  const { count: headCount, error: countErr } = await countQ
  if (countErr) {
    console.error('[adminListVehiclesPage] count', countErr)
    throw new Error(countErr.message || 'Unable to count fleet vehicles')
  }
  const totalCount = typeof headCount === 'number' ? headCount : 0

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  if (page > totalPages) {
    page = totalPages
  }

  const dataQ = applyFleetListFilters(admin, params, 'data')
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error } = await dataQ.range(from, to)

  if (error) {
    console.error('[adminListVehiclesPage] data', error)
    throw new Error(error.message || 'Unable to load fleet vehicles')
  }
  if (!data) {
    return { rows: [], totalCount, page, pageSize }
  }

  return {
    rows: data as AdminVehicleRow[],
    totalCount,
    page,
    pageSize,
  }
}

export async function adminListVehicles(): Promise<AdminVehicleRow[]> {
  const { rows } = await adminListVehiclesPage({ page: 1, pageSize: 200 })
  return rows
}

export async function adminGetVehicle(id: string): Promise<AdminVehicleRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('vehicles').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as AdminVehicleRow
}

export async function adminGetFleetDashboardMetrics(): Promise<AdminFleetDashboardMetrics> {
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: vehicles, error: vErr }, { data: bookings, error: bErr }] = await Promise.all([
    admin.from('vehicles').select('id, available, featured, price_per_day'),
    admin
      .from('bookings')
      .select('vehicle_id')
      .in('booking_status', ['confirmed', 'pending_payment'])
      .not('vehicle_id', 'is', null)
      .lte('pickup_date', today)
      .gte('return_date', today),
  ])

  if (vErr) {
    return {
      totalVehicles: 0,
      availableVehicles: 0,
      featuredVehicles: 0,
      avgPricePerDay: null,
      vehiclesOnTripToday: 0,
      bookableUtilizationPercent: 0,
    }
  }

  const list = (vehicles ?? []) as Pick<AdminVehicleRow, 'id' | 'available' | 'featured' | 'price_per_day'>[]
  if (!list.length) {
    return {
      totalVehicles: 0,
      availableVehicles: 0,
      featuredVehicles: 0,
      avgPricePerDay: null,
      vehiclesOnTripToday: 0,
      bookableUtilizationPercent: 0,
    }
  }

  const totalVehicles = list.length
  const availableVehicles = list.filter((v) => v.available !== false).length
  const featuredVehicles = list.filter((v) => v.featured).length
  const prices = list.map((v) => Number(v.price_per_day ?? 0)).filter((n) => n > 0)
  const avgPricePerDay =
    prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null

  const bookableIds = new Set(list.filter((v) => v.available !== false).map((v) => v.id))
  const onTripIds = new Set(
    (bErr ? [] : (bookings ?? []))
      .map((r: { vehicle_id: string | null }) => r.vehicle_id)
      .filter((id): id is string => Boolean(id)),
  )
  const utilizedOnBookable = [...onTripIds].filter((id) => bookableIds.has(id)).length
  const bookableUtilizationPercent =
    bookableIds.size === 0 ? 0 : Math.min(100, Math.round((utilizedOnBookable / bookableIds.size) * 100))

  return {
    totalVehicles,
    availableVehicles,
    featuredVehicles,
    avgPricePerDay,
    vehiclesOnTripToday: onTripIds.size,
    bookableUtilizationPercent,
  }
}
