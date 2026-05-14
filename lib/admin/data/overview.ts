import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type AdminOverviewStats = {
  vehicles: number
  customers: number
  bookings: number
  pendingBookings: number
  pendingKyc: number
}

export async function adminOverviewStats(): Promise<AdminOverviewStats> {
  const admin = createAdminClient()

  const vehiclesRes = await admin.from('vehicles').select('id', { count: 'exact', head: true })
  const customersRes = await admin.from('profiles').select('user_id', { count: 'exact', head: true })
  const bookingsRes = await admin.from('bookings').select('id', { count: 'exact', head: true })
  const pendingBookingsRes = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('booking_status', 'pending_payment')
  const pendingKycRes = await admin
    .from('kyc_documents')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'reviewing'])

  if (vehiclesRes.error) logPostgrestError('[adminOverviewStats] vehicles', vehiclesRes.error)
  if (customersRes.error) logPostgrestError('[adminOverviewStats] customers', customersRes.error)
  if (bookingsRes.error) logPostgrestError('[adminOverviewStats] bookings', bookingsRes.error)
  if (pendingBookingsRes.error) logPostgrestError('[adminOverviewStats] pendingBookings', pendingBookingsRes.error)
  if (pendingKycRes.error) logPostgrestError('[adminOverviewStats] pendingKyc', pendingKycRes.error)

  return {
    vehicles: vehiclesRes.count ?? 0,
    customers: customersRes.count ?? 0,
    bookings: bookingsRes.count ?? 0,
    pendingBookings: pendingBookingsRes.count ?? 0,
    pendingKyc: pendingKycRes.count ?? 0,
  }
}
