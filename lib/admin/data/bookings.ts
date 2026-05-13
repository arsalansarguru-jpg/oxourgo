import 'server-only'

import type { BookingWithCar } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

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
  ops_note,
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

export async function adminListBookings(): Promise<BookingWithCar[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bookings')
    .select(bookingSelect)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error || !data) return []
  return data as unknown as BookingWithCar[]
}

export async function adminGetBooking(id: string): Promise<BookingWithCar | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('bookings').select(bookingSelect).eq('id', id).maybeSingle()

  if (error || !data) return null
  return data as unknown as BookingWithCar
}

export async function adminListBookingsForUser(userId: string): Promise<BookingWithCar[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bookings')
    .select(bookingSelect)
    .eq('user_id', userId)
    .order('pickup_at', { ascending: false })
    .limit(100)

  if (error || !data) return []
  return data as unknown as BookingWithCar[]
}
