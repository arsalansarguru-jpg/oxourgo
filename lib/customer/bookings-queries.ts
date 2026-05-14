import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { BookingWithCar } from '@/lib/supabase/database.types'

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
  approved_at,
  handed_over_at,
  returned_at,
  completed_at,
  pickup_checklist,
  return_checklist,
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

export async function listBookingsForUser(userId: string): Promise<ListBookingsForUserResult> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(bookingSelect)
    .eq('user_id', userId)
    .order('pickup_date', { ascending: false })

  if (error) {
    console.error('[listBookingsForUser]', error.message, error.code, error.details)
    return {
      ok: false,
      error: { code: 'query_failed', message: 'Unable to load reservations.' },
    }
  }
  return { ok: true, data: (data ?? []) as unknown as BookingWithCar[] }
}

export async function getBookingForUser(bookingId: string, userId: string): Promise<BookingWithCar | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(bookingSelect)
    .eq('id', bookingId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as BookingWithCar
}
