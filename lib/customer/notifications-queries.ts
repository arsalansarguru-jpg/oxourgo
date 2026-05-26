import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { NotificationRow } from '@/lib/supabase/database.types'
import { listBookingsForUser } from './bookings-queries'
import { getCustomerProfileSnapshot } from './profile-queries'

export async function listNotificationsForUser(userId: string, limit = 100): Promise<NotificationRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as NotificationRow[]
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) return 0
  return count ?? 0
}

export async function getNotificationsWithSynthetics(userId: string) {
  const [dbNotifications, bookingsResult, profile] = await Promise.all([
    listNotificationsForUser(userId),
    listBookingsForUser(userId).catch(() => ({ ok: true, data: [] } as const)),
    getCustomerProfileSnapshot(userId).catch(() => null),
  ])

  const bookings = bookingsResult.ok ? bookingsResult.data : []
  const synthetics: NotificationRow[] = []

  // Check KYC status
  if (profile && profile.kyc_status !== 'approved') {
    synthetics.push({
      id: 'synthetic-kyc-alert',
      user_id: userId,
      title: 'Action Required: Complete your KYC',
      body: 'Upload your Driving License, Government ID, and Selfie in the KYC Center to verify your profile and unlock bookings.',
      read_at: null,
      created_at: new Date().toISOString(),
      type: 'kyc_alert',
      metadata: {},
    })
  }

  // Check bookings for pending payment
  if (bookings && bookings.length > 0) {
    const pendingPaymentBookings = bookings.filter(b => b.booking_status === 'pending_payment')
    for (const b of pendingPaymentBookings) {
      synthetics.push({
        id: `synthetic-payment-alert-${b.id}`,
        user_id: userId,
        title: 'Payment Pending for Booking',
        body: `Please complete the rental payment for your upcoming trip to Mira Road Hub to secure your vehicle.`,
        read_at: null,
        created_at: new Date().toISOString(),
        type: 'payment_alert',
        metadata: { booking_id: b.id },
      })
    }
  }

  const allNotifications = [...synthetics, ...dbNotifications]
  const unreadCount = allNotifications.filter(n => !n.read_at).length

  return {
    notifications: allNotifications,
    unreadCount,
  }
}
