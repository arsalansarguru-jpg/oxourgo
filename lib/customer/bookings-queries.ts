import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { BookingWithCar } from '@/lib/supabase/database.types'

const bookingSelect = `
  id,
  car_id,
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
  )
`

export async function listBookingsForUser(userId: string): Promise<BookingWithCar[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(bookingSelect)
    .eq('user_id', userId)
    .order('pickup_at', { ascending: false })

  if (error || !data) return []
  return data as unknown as BookingWithCar[]
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
