import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type DamageReportRow = {
  id: string
  bookingId: string | null
  vehicleId: string | null
  status: string
  description: string
  estimatedCostRupees: number
  customerLiableRupees: number
  reportedAt: string
  href: string
}

export type DamageReportMetrics = {
  openClaims: number
  underInspection: number
  totalLiabilityRupees: number
}

const OPEN_STATUSES = ['reported', 'under_inspection', 'approved'] as const

export async function adminDamageMetrics(): Promise<DamageReportMetrics> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('damage_reports')
    .select('status, customer_liable_rupees')
    .in('status', [...OPEN_STATUSES])

  if (error) {
    logPostgrestError('[damageReports] metrics', error)
    return { openClaims: 0, underInspection: 0, totalLiabilityRupees: 0 }
  }

  const rows = data ?? []
  return {
    openClaims: rows.filter((r) => r.status === 'reported' || r.status === 'approved').length,
    underInspection: rows.filter((r) => r.status === 'under_inspection').length,
    totalLiabilityRupees: rows.reduce((s, r) => s + Math.max(0, Math.round(Number(r.customer_liable_rupees ?? 0))), 0),
  }
}

export async function adminListDamageReports(limit = 80): Promise<DamageReportRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('damage_reports')
    .select('id, booking_id, vehicle_id, status, description, estimated_cost_rupees, customer_liable_rupees, reported_at')
    .order('reported_at', { ascending: false })
    .limit(limit)

  if (error) {
    logPostgrestError('[damageReports] list', error)
    return []
  }

  return (data ?? []).map((r) => ({
    id: r.id as string,
    bookingId: (r.booking_id as string | null) ?? null,
    vehicleId: (r.vehicle_id as string | null) ?? null,
    status: (r.status as string)?.trim() || 'reported',
    description: (r.description as string)?.trim() || '',
    estimatedCostRupees: Math.max(0, Math.round(Number(r.estimated_cost_rupees ?? 0))),
    customerLiableRupees: Math.max(0, Math.round(Number(r.customer_liable_rupees ?? 0))),
    reportedAt: r.reported_at as string,
    href: r.booking_id ? `/admin/bookings/${r.booking_id}` : r.vehicle_id ? `/admin/fleet/${r.vehicle_id}` : '/admin/damage',
  }))
}
