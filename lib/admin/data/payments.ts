import 'server-only'

import type { Database } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

export type PaymentEventRow = Database['public']['Tables']['payment_events']['Row']

export async function adminListPaymentEvents(limit = 150): Promise<PaymentEventRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('payment_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as PaymentEventRow[]
}

export type BookingPaymentSummary = {
  payment_status: string
  count: number
}

export async function adminBookingPaymentSummary(): Promise<BookingPaymentSummary[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('bookings').select('payment_status')
  if (error || !data) return []

  const map = new Map<string, number>()
  for (const row of data as { payment_status: string }[]) {
    map.set(row.payment_status, (map.get(row.payment_status) ?? 0) + 1)
  }
  return [...map.entries()].map(([payment_status, count]) => ({ payment_status, count }))
}
