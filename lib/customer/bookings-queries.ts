import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { BookingWithCar } from '@/lib/supabase/database.types'

const bookingSelect = `
  id,
  car_id,
  vehicle_id,
  user_id,
  pickup_at,
  return_at,
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
  created_at,
  updated_at,
  cars (
    id,
    brand,
    model,
    year,
    registration_number,
    fuel_type,
    transmission,
    seats,
    pricing_per_day,
    security_deposit,
    availability_status,
    featured,
    cover_image_path,
    gallery_paths,
    created_at
  ),
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
    .order('pickup_at', { ascending: false })

  if (error) {
    return {
      ok: false,
      error: { code: 'query_failed', message: error.message },
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
