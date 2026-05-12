import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export type AdminOverviewStats = {
  cars: number
  bookings: number
  pendingBookings: number
  pendingKyc: number
}

export async function adminOverviewStats(): Promise<AdminOverviewStats> {
  const admin = createAdminClient()

  const [{ count: cars }, { count: bookings }, { count: pendingBookings }, { count: pendingKyc }] = await Promise.all([
    admin.from('cars').select('id', { count: 'exact', head: true }),
    admin.from('bookings').select('id', { count: 'exact', head: true }),
    admin.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'pending_payment'),
    admin.from('kyc_documents').select('id', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
  ])

  return {
    cars: cars ?? 0,
    bookings: bookings ?? 0,
    pendingBookings: pendingBookings ?? 0,
    pendingKyc: pendingKyc ?? 0,
  }
}
