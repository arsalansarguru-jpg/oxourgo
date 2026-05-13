import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export type AdminOverviewStats = {
  vehicles: number
  customers: number
  bookings: number
  pendingBookings: number
  pendingKyc: number
}

export async function adminOverviewStats(): Promise<AdminOverviewStats> {
  const admin = createAdminClient()

  const [
    { count: vehicles },
    { count: customers },
    { count: bookings },
    { count: pendingBookings },
    { count: pendingKyc },
  ] = await Promise.all([
    admin.from('vehicles').select('id', { count: 'exact', head: true }),
    admin.from('profiles').select('user_id', { count: 'exact', head: true }),
    admin.from('bookings').select('id', { count: 'exact', head: true }),
    admin.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'pending_payment'),
    admin.from('kyc_documents').select('id', { count: 'exact', head: true }).in('status', ['pending', 'reviewing']),
  ])

  return {
    vehicles: vehicles ?? 0,
    customers: customers ?? 0,
    bookings: bookings ?? 0,
    pendingBookings: pendingBookings ?? 0,
    pendingKyc: pendingKyc ?? 0,
  }
}
