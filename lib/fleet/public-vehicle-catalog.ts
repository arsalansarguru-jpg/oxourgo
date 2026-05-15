import 'server-only'

import type { PostgrestError } from '@supabase/supabase-js'

import { logFleetRecoverable } from '@/lib/fleet/fleet-catalog-logging'
import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server-client'
import type { VehicleRow } from '@/lib/fleet/vehicle-mappers'

export type { VehicleRow } from '@/lib/fleet/vehicle-mappers'

/** Re-export for call sites that still import logging from this module. */
export { logFleetRecoverable, logFleetActionable, logFleetVehiclesError } from '@/lib/fleet/fleet-catalog-logging'

/**
 * Explicit column list for narrow selects (detail pages, joins).
 * Catalog listing uses `select('*')` for resilience if the live schema adds columns.
 */
export const VEHICLE_PUBLIC_COLUMNS =
  'id,name,brand,transmission,fuel_type,seats,price_per_day,image,featured,available,year,registration_number,security_deposit,created_at' as const

/**
 * Homepage + `/fleet`: list vehicles for browsing (including `available=false`, which shows as Unavailable with booking disabled).
 * If `available` is missing on a row, optional legacy `availability_status` (when present on the object) can hide maintenance-only rows.
 */
export function isVehicleShownOnPublicCatalog(row: VehicleRow): boolean {
  if (row.deleted_at) return false
  if (row.archived_at) return false
  if (typeof row.available === 'boolean') return true
  const s = String(row.availability_status ?? '').trim().toLowerCase()
  if (
    s === 'unavailable' ||
    s === 'maintenance' ||
    s === 'service' ||
    s === 'accident_hold' ||
    s === 'inactive' ||
    s === 'draft'
  ) {
    return false
  }
  return true
}

/** Legacy `cars` table string `availability_status` only (vehicles use `isVehicleAvailableForBooking`). */
export function isVehiclePubliclyListable(availabilityStatus: string | null | undefined): boolean {
  return String(availabilityStatus ?? '').trim().toLowerCase() === 'available'
}

/**
 * Loads rows from **`public.vehicles`** with the anon key (no cookie session).
 * On any failure, returns **`rows: []`** so UI can render an empty fleet state without throwing.
 * Relies on your Supabase **SELECT** policy for `anon` / `authenticated`.
 */
export async function fetchPublicVehicleRows(): Promise<{ rows: VehicleRow[] }> {
  try {
    const supabase = createPublicServerSupabaseClient()
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      const pe = error as PostgrestError
      const blob = `${String(pe.message ?? '')}\n${String(pe.details ?? '')}`
      const networkish = /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|fetch failed|network|certificate|aborted/i.test(blob)
      logFleetRecoverable(networkish ? 'vehicles.select.network' : 'vehicles.select', error)
      return { rows: [] }
    }

    return { rows: (data ?? []) as VehicleRow[] }
  } catch (e) {
    logFleetRecoverable('vehicles.select.exception', e)
    return { rows: [] }
  }
}
