import 'server-only'

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

export async function adminListVehicles(): Promise<AdminVehicleRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('vehicles').select('*').order('created_at', { ascending: false })
  if (error || !data) return []
  return data as AdminVehicleRow[]
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
