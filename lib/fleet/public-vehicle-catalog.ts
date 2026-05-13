import 'server-only'

import type { PostgrestError } from '@supabase/supabase-js'

import { createPublicServerSupabaseClient } from '@/lib/supabase/public-server-client'
import type { Database } from '@/lib/supabase/database.types'

export type VehicleRow = Database['public']['Tables']['vehicles']['Row']

/**
 * Explicit column list for narrow selects (detail pages, joins).
 * Catalog listing uses `select('*')` for resilience if the live schema adds columns.
 */
export const VEHICLE_PUBLIC_COLUMNS =
  'id,name,brand,transmission,fuel_type,seats,price_per_day,image,featured,availability_status,year,registration_number,security_deposit,created_at' as const

/**
 * Homepage + `/fleet`: show vehicles unless explicitly taken off sale.
 * (Booking/checkout still requires strict `available` — see `isVehiclePubliclyListable`.)
 */
export function isVehicleShownOnPublicCatalog(availabilityStatus: string | null | undefined): boolean {
  const s = String(availabilityStatus ?? '').trim().toLowerCase()
  if (!s) return true
  if (s === 'unavailable' || s === 'maintenance' || s === 'inactive' || s === 'draft') return false
  return true
}

/** Checkout / overlap: vehicle must be explicitly available (case-insensitive). */
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
export async function fetchPublicVehicleRows(): Promise<
  { ok: true; rows: VehicleRow[] } | { ok: false; error: string }
> {
  try {
    const supabase = createPublicServerSupabaseClient()
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      logFleetVehiclesError('vehicles.select', serializePostgrestError(error))
      return { ok: false, error: error.message || 'Failed to load vehicles from Supabase.' }
    }

    const rows = (data ?? []) as VehicleRow[]

    if (rows.length === 0) {
      console.warn(
        '[oxour-go/fleet:vehicles.select]',
        'Query succeeded but returned 0 rows from public.vehicles — verify data exists and RLS allows SELECT for anon.',
      )
    }

    return { ok: true, rows }
  } catch (e) {
    logFleetVehiclesError('vehicles.select.exception', e)
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Unexpected error while loading vehicles.',
    }
  }
}
