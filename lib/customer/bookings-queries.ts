import 'server-only'

import { createClient } from '@/lib/supabase/server'
import {
  BOOKING_SELECT_MINIMAL,
  BOOKING_SELECT_OPERATIONAL,
  BOOKING_VEHICLE_EMBED,
  normalizeBookingRow,
} from '@/lib/supabase/booking-select'
import type { BookingWithCar } from '@/lib/supabase/database.types'

const bookingSelectWithVehicle = `
  ${BOOKING_SELECT_OPERATIONAL},
  ${BOOKING_VEHICLE_EMBED}
`.trim()

/** Progressive tiers: widest operational + vehicle embed, then operational, then minimal. */
const CUSTOMER_BOOKING_SELECT_TIERS = [
  bookingSelectWithVehicle,
  BOOKING_SELECT_OPERATIONAL,
  BOOKING_SELECT_MINIMAL,
] as const

export type ListBookingsForUserError = {
  code: 'query_failed'
  message: string
}

export type ListBookingsForUserResult =
  | { ok: true; data: BookingWithCar[] }
  | { ok: false; error: ListBookingsForUserError }

export function unwrapListBookingsResult(result: ListBookingsForUserResult): BookingWithCar[] {
  return result.ok ? result.data : []
}

function asBookingRows(data: unknown): BookingWithCar[] {
  const rows = (data ?? []) as BookingWithCar[]
  return rows.map((row) => normalizeBookingRow(row) as BookingWithCar)
}

async function queryBookingsTier(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  select: string,
  withDeletedFilter: boolean,
): Promise<{ data: unknown; error: { message: string; code?: string; details?: string } | null }> {
  let q = supabase
    .from('bookings')
    .select(select)
    .eq('user_id', userId)
    .order('pickup_date', { ascending: false })

  if (withDeletedFilter) {
    q = q.is('deleted_at', null)
  }

  const { data, error } = await q
  return { data, error }
}

export async function listBookingsForUser(userId: string): Promise<ListBookingsForUserResult> {
  const supabase = await createClient()

  for (const select of CUSTOMER_BOOKING_SELECT_TIERS) {
    let { data, error } = await queryBookingsTier(supabase, userId, select, true)

    if (error?.message?.includes('deleted_at')) {
      ;({ data, error } = await queryBookingsTier(supabase, userId, select, false))
    }

    if (!error) {
      return { ok: true, data: asBookingRows(data) }
    }

    console.warn('[listBookingsForUser] tier failed', {
      tier: select.slice(0, 48),
      message: error.message,
      code: error.code,
    })
  }

  const { count, error: countError } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (!countError && (count ?? 0) === 0) {
    return { ok: true, data: [] }
  }

  console.error('[listBookingsForUser] all tiers failed for user', userId, countError?.message)
  return {
    ok: false,
    error: { code: 'query_failed', message: 'Unable to load reservations.' },
  }
}

export async function getBookingForUser(bookingId: string, userId: string): Promise<BookingWithCar | null> {
  const supabase = await createClient()

  for (const select of CUSTOMER_BOOKING_SELECT_TIERS) {
    const { data, error } = await supabase
      .from('bookings')
      .select(select)
      .eq('id', bookingId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!error && data) {
      return normalizeBookingRow(data as unknown as BookingWithCar) as BookingWithCar
    }
  }

  return null
}

export type CustomerInspectionPhotoRow = {
  id: string
  phase: string
  slot: string
  storage_path: string
}

/** RLS: rows only for bookings the current user owns. */
export async function listInspectionPhotosForBooking(bookingId: string): Promise<CustomerInspectionPhotoRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('booking_inspection_photos')
    .select('id, phase, slot, storage_path')
    .eq('booking_id', bookingId)
    .order('phase')
    .order('slot')

  if (error) {
    console.error('[listInspectionPhotosForBooking]', error.message)
    return []
  }
  return (data ?? []) as CustomerInspectionPhotoRow[]
}
