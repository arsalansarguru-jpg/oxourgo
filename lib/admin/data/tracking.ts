import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type VehicleTrackingRow = {
  id: string
  name: string
  brand: string
  registration: string | null
  location: string | null
  gpsTrackerId: string | null
  gpsStatus: string
  lastGpsPingAt: string | null
  fuelLevelPct: number | null
  availabilityStatus: string
  onTrip: boolean
  href: string
}

export type VehicleComplianceAlert = {
  vehicleId: string
  name: string
  registration: string | null
  alertType: string
  earliestExpiry: string | null
}

export async function adminListVehicleTracking(): Promise<VehicleTrackingRow[]> {
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const [vehiclesRes, bookingsRes] = await Promise.all([
    admin
      .from('vehicles')
      .select(
        'id, name, brand, registration_number, vehicle_location, gps_tracker_id, gps_status, last_gps_ping_at, fuel_level_pct, availability_status',
      )
      .is('deleted_at', null)
      .order('name', { ascending: true }),
    admin
      .from('bookings')
      .select('vehicle_id')
      .in('booking_status', ['confirmed', 'active'])
      .not('vehicle_id', 'is', null)
      .lte('pickup_date', today)
      .gte('return_date', today),
  ])

  if (vehiclesRes.error) logPostgrestError('[tracking] vehicles', vehiclesRes.error)
  if (bookingsRes.error) logPostgrestError('[tracking] bookings', bookingsRes.error)

  const onTrip = new Set(
    (bookingsRes.data ?? [])
      .map((r: { vehicle_id: string | null }) => r.vehicle_id)
      .filter((id): id is string => Boolean(id)),
  )

  return (vehiclesRes.data ?? []).map((v) => ({
    id: v.id as string,
    name: (v.name as string)?.trim() || 'Vehicle',
    brand: (v.brand as string)?.trim() || '',
    registration: (v.registration_number as string | null)?.trim() || null,
    location: (v.vehicle_location as string | null)?.trim() || null,
    gpsTrackerId: (v.gps_tracker_id as string | null)?.trim() || null,
    gpsStatus: (v.gps_status as string)?.trim() || 'unknown',
    lastGpsPingAt: (v.last_gps_ping_at as string | null) ?? null,
    fuelLevelPct: v.fuel_level_pct != null ? Number(v.fuel_level_pct) : null,
    availabilityStatus: (v.availability_status as string)?.trim() || 'available',
    onTrip: onTrip.has(v.id as string),
    href: `/admin/fleet/${v.id}`,
  }))
}

export async function adminVehicleComplianceAlerts(): Promise<VehicleComplianceAlert[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('vehicles')
    .select('id, name, registration_number, insurance_expiry, puc_expiry, rc_expiry')
    .is('deleted_at', null)

  if (error) {
    logPostgrestError('[tracking] compliance', error)
    return []
  }

  const soon = new Date()
  soon.setUTCDate(soon.getUTCDate() + 30)
  const cutoff = soon.toISOString().slice(0, 10)
  const alerts: VehicleComplianceAlert[] = []

  for (const v of data ?? []) {
    const ins = (v.insurance_expiry as string | null)?.slice(0, 10)
    const puc = (v.puc_expiry as string | null)?.slice(0, 10)
    const rc = (v.rc_expiry as string | null)?.slice(0, 10)
    const expiries: Array<{ type: string; date: string }> = []
    if (ins && ins <= cutoff) expiries.push({ type: 'insurance', date: ins })
    if (puc && puc <= cutoff) expiries.push({ type: 'puc', date: puc })
    if (rc && rc <= cutoff) expiries.push({ type: 'rc', date: rc })
    if (expiries.length === 0) continue
    const earliest = expiries.sort((a, b) => a.date.localeCompare(b.date))[0]
    alerts.push({
      vehicleId: v.id as string,
      name: (v.name as string)?.trim() || 'Vehicle',
      registration: (v.registration_number as string | null)?.trim() || null,
      alertType: earliest.type,
      earliestExpiry: earliest.date,
    })
  }

  return alerts.sort((a, b) => (a.earliestExpiry ?? '').localeCompare(b.earliestExpiry ?? ''))
}
