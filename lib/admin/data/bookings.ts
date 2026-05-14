import 'server-only'

import type { BookingWithCar } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

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

export type AdminBookingListItem = BookingWithCar & { customerEmail: string | null }

export async function adminListBookings(options?: { booking_status?: string }): Promise<BookingWithCar[]> {
  const admin = createAdminClient()
  let q = admin.from('bookings').select(bookingSelect).order('created_at', { ascending: false }).limit(200)
  if (options?.booking_status) {
    q = q.eq('booking_status', options.booking_status)
  }
  const { data, error } = await q

  if (error || !data) return []
  return data as unknown as BookingWithCar[]
}

/** Resolves auth emails for unique customers (bounded) — admin list UX only. */
export async function adminEnrichBookingsWithCustomerEmails(rows: BookingWithCar[]): Promise<AdminBookingListItem[]> {
  if (rows.length === 0) return []

  const admin = createAdminClient()
  const uniqueIds = [...new Set(rows.map((r) => r.user_id))].slice(0, 100)
  const emailByUserId = new Map<string, string | null>()

  await Promise.all(
    uniqueIds.map(async (uid) => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(uid)
        if (error || !data?.user) {
          emailByUserId.set(uid, null)
          return
        }
        emailByUserId.set(uid, data.user.email ?? null)
      } catch {
        emailByUserId.set(uid, null)
      }
    }),
  )

  return rows.map((r) => ({
    ...r,
    customerEmail: emailByUserId.get(r.user_id) ?? null,
  }))
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
    .order('pickup_date', { ascending: false })
    .limit(100)

  if (error || !data) return []
  return data as unknown as BookingWithCar[]
}
