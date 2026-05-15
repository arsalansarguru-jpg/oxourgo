import 'server-only'

import type { AdminAuditActivityRow } from '@/lib/admin/data/staff-users'
import { listRecentAdminAuditForAdmin } from '@/lib/admin/data/staff-users'
import type { AdminVehicleRow } from '@/lib/admin/data/fleet'
import { adminListVehicles } from '@/lib/admin/data/fleet'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type OpsDashboardStats = {
  bookingsOnHold: number
  manualBookings: number
  fleetMaintenance: number
  fleetAccidentHold: number
  fleetService: number
  vipBookings: number
}

export type BookingOpsActivityRow = {
  id: string
  bookingId: string
  actorUserId: string | null
  activityType: string
  summary: string
  createdAt: string
}

export type BookingVehicleAssignmentRow = {
  id: string
  bookingId: string
  fromVehicleId: string | null
  toVehicleId: string
  reason: string | null
  recalculatePricing: boolean
  previousTotalRupees: number | null
  newTotalRupees: number | null
  createdAt: string
}

export async function adminOpsDashboardStats(): Promise<OpsDashboardStats> {
  const admin = createAdminClient()

  const [holds, manual, maint, accident, service, vip] = await Promise.all([
    admin.from('bookings').select('id', { count: 'exact', head: true }).not('ops_hold_at', 'is', null),
    admin.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_source', 'admin_manual'),
    admin.from('vehicles').select('id', { count: 'exact', head: true }).eq('availability_status', 'maintenance'),
    admin.from('vehicles').select('id', { count: 'exact', head: true }).eq('availability_status', 'accident_hold'),
    admin.from('vehicles').select('id', { count: 'exact', head: true }).eq('availability_status', 'service'),
    admin.from('bookings').select('id', { count: 'exact', head: true }).eq('vip_flag', true),
  ])

  for (const res of [holds, manual, maint, accident, service, vip]) {
    if (res.error) logPostgrestError('[adminOpsDashboardStats]', res.error)
  }

  return {
    bookingsOnHold: holds.count ?? 0,
    manualBookings: manual.count ?? 0,
    fleetMaintenance: maint.count ?? 0,
    fleetAccidentHold: accident.count ?? 0,
    fleetService: service.count ?? 0,
    vipBookings: vip.count ?? 0,
  }
}

export async function adminListRecentBookingOpsActivity(limit = 30): Promise<BookingOpsActivityRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('booking_ops_activity')
    .select('id, booking_id, actor_user_id, activity_type, summary, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logPostgrestError('[adminListRecentBookingOpsActivity]', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    bookingId: row.booking_id,
    actorUserId: row.actor_user_id,
    activityType: row.activity_type,
    summary: row.summary,
    createdAt: row.created_at,
  }))
}

export async function adminListBookingOpsActivity(bookingId: string, limit = 50): Promise<BookingOpsActivityRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('booking_ops_activity')
    .select('id, booking_id, actor_user_id, activity_type, summary, created_at')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logPostgrestError('[adminListBookingOpsActivity]', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    bookingId: row.booking_id,
    actorUserId: row.actor_user_id,
    activityType: row.activity_type,
    summary: row.summary,
    createdAt: row.created_at,
  }))
}

export async function adminListBookingVehicleAssignments(
  bookingId: string,
): Promise<BookingVehicleAssignmentRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('booking_vehicle_assignments')
    .select(
      'id, booking_id, from_vehicle_id, to_vehicle_id, reason, recalculate_pricing, previous_total_rupees, new_total_rupees, created_at',
    )
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })

  if (error) {
    logPostgrestError('[adminListBookingVehicleAssignments]', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    bookingId: row.booking_id,
    fromVehicleId: row.from_vehicle_id,
    toVehicleId: row.to_vehicle_id,
    reason: row.reason,
    recalculatePricing: row.recalculate_pricing,
    previousTotalRupees: row.previous_total_rupees,
    newTotalRupees: row.new_total_rupees,
    createdAt: row.created_at,
  }))
}

export async function adminLoadOperationsContext(): Promise<{
  stats: OpsDashboardStats
  audit: AdminAuditActivityRow[]
  activity: BookingOpsActivityRow[]
  vehicles: AdminVehicleRow[]
}> {
  const [stats, audit, activity, vehicles] = await Promise.all([
    adminOpsDashboardStats(),
    listRecentAdminAuditForAdmin(25),
    adminListRecentBookingOpsActivity(25),
    adminListVehicles(),
  ])
  return { stats, audit, activity, vehicles }
}
