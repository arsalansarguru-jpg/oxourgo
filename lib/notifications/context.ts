import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export type BookingNotifyContext = {
  user_id: string
  pickup_at: string
  car_label: string | null
}

export async function getBookingNotifyContext(bookingId: string): Promise<BookingNotifyContext | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bookings')
    .select('user_id, pickup_at, cars(brand,model)')
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) return null

  const cars = data.cars as { brand: string; model: string } | { brand: string; model: string }[] | null
  const c = Array.isArray(cars) ? cars[0] : cars
  const car_label = c ? `${c.brand} ${c.model}`.trim() : null

  return {
    user_id: data.user_id,
    pickup_at: data.pickup_at,
    car_label,
  }
}
