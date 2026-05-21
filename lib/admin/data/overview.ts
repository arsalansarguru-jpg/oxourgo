import 'server-only'

import { countPendingKycCustomers } from '@/lib/admin/kyc-metrics'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type AdminOverviewStats = {
  vehicles: number
  customers: number
  bookings: number
  pendingBookings: number
  pendingKyc: number
  whatsappBookings: number
  activeWhatsAppConversations: number
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
  const pendingKycCount = await countPendingKycCustomers()
  const whatsappBookingsRes = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('booking_source', 'whatsapp')
  const activeWaConversationsRes = await admin
    .from('whatsapp_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  if (vehiclesRes.error) logPostgrestError('[adminOverviewStats] vehicles', vehiclesRes.error)
  if (customersRes.error) logPostgrestError('[adminOverviewStats] customers', customersRes.error)
  if (bookingsRes.error) logPostgrestError('[adminOverviewStats] bookings', bookingsRes.error)
  if (pendingBookingsRes.error) logPostgrestError('[adminOverviewStats] pendingBookings', pendingBookingsRes.error)
  if (whatsappBookingsRes.error) logPostgrestError('[adminOverviewStats] whatsappBookings', whatsappBookingsRes.error)
  if (activeWaConversationsRes.error) {
    logPostgrestError('[adminOverviewStats] activeWhatsAppConversations', activeWaConversationsRes.error)
  }

  return {
    vehicles: vehiclesRes.count ?? 0,
    customers: customersRes.count ?? 0,
    bookings: bookingsRes.count ?? 0,
    pendingBookings: pendingBookingsRes.count ?? 0,
    pendingKyc: pendingKycCount,
    whatsappBookings: whatsappBookingsRes.count ?? 0,
    activeWhatsAppConversations: activeWaConversationsRes.count ?? 0,
  }
}
