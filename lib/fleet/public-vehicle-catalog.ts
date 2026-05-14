import 'server-only'

import type { PostgrestError } from '@supabase/supabase-js'

import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server-client'
import type { VehicleRow } from '@/lib/fleet/vehicle-mappers'

export type { VehicleRow } from '@/lib/fleet/vehicle-mappers'

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
  if (typeof row.available === 'boolean') return true
  const s = String(row.availability_status ?? '').trim().toLowerCase()
  if (s === 'unavailable' || s === 'maintenance' || s === 'inactive' || s === 'draft') return false
  return true
}

/** Legacy `cars` table string `availability_status` only (vehicles use `isVehicleAvailableForBooking`). */
export function isVehiclePubliclyListable(availabilityStatus: string | null | undefined): boolean {
  return String(availabilityStatus ?? '').trim().toLowerCase() === 'available'
}

export function logFleetVehiclesError(scope: string, detail: unknown): void {
  console.error(`[oxour-go/fleet:${scope}]`, detail)
}

function serializePostgrestError(err: PostgrestError) {
  return {
    message: err.message,
    code: err.code,
    details: err.details,
    hint: err.hint,
  }
}

/**
 * Loads rows from **`public.vehicles`** with the anon key (no cookie session).
 * Relies on your Supabase **SELECT** policy for `anon` / `authenticated`.
 */
export async function fetchPublicVehicleRows(): Promise<{ ok: true; rows: VehicleRow[] } | { ok: false }> {
  try {
    const supabase = createPublicServerSupabaseClient()
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      logFleetVehiclesError('vehicles.select', serializePostgrestError(error))
      return { ok: false }
    }

    const rows = (data ?? []) as VehicleRow[]

    if (rows.length === 0) {
      console.warn('[oxour-go/fleet:vehicles.select] Query returned 0 rows (empty catalog or filtered inventory).')
    }

    return { ok: true, rows }
  } catch (e) {
    logFleetVehiclesError('vehicles.select.exception', e)
    return { ok: false }
  }
}
