import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export type BookingNotifyContext = {
  user_id: string
  pickup_date: string
  car_label: string | null
}

export async function getBookingNotifyContext(bookingId: string): Promise<BookingNotifyContext | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bookings')
    .select('user_id, pickup_date, cars(brand,model)')
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) return null

  const cars = data.cars as unknown as
    | { brand: string; model: string }
    | { brand: string; model: string }[]
    | null
  const c = Array.isArray(cars) ? cars[0] : cars
  const car_label = c ? `${c.brand} ${c.model}`.trim() : null

  return {
    user_id: data.user_id,
    pickup_date: data.pickup_date,
    car_label,
  }
}
