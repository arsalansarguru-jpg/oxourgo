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
    .select('user_id, pickup_date, vehicles(name, brand)')
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) return null

  const vehicles = data.vehicles as unknown as
    | { name: string; brand: string }
    | { name: string; brand: string }[]
    | null
  const v = Array.isArray(vehicles) ? vehicles[0] : vehicles
  const car_label = v ? (v.name?.trim() || `${v.brand}`.trim() || null) : null

  return {
    user_id: data.user_id,
    pickup_date: data.pickup_date,
    car_label,
  }
}
