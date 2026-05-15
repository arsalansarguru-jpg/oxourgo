import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { notifyCustomer } from '@/lib/notifications/emit'
import { enqueueOutboundEmail } from '@/lib/notifications/channels/outbound-enqueue'
import type { Json } from '@/lib/supabase/database.types'

/**
 * Return reminders for active bookings with return window approaching.
 * Secured cron (same pattern as trip pickup reminders).
 */
export async function runReturnReminderJob(options?: { hoursMin?: number; hoursMax?: number }): Promise<{
  scanned: number
  inserted: number
}> {
  const hoursMin = options?.hoursMin ?? 22
  const hoursMax = options?.hoursMax ?? 26
  const admin = createAdminClient()
  const from = new Date(Date.now() + hoursMin * 3600000).toISOString()
  const to = new Date(Date.now() + hoursMax * 3600000).toISOString()

  const { data: bookings, error } = await admin
    .from('bookings')
    .select('id, user_id, return_date, vehicles(name, brand)')
    .eq('booking_status', 'active')
    .gte('return_date', from)
    .lte('return_date', to)

  if (error || !bookings?.length) return { scanned: 0, inserted: 0 }

  let inserted = 0
  for (const b of bookings) {
    const { data: existingRows } = await admin
      .from('notifications')
      .select('metadata')
      .eq('user_id', b.user_id)
      .eq('type', 'return_reminder')

    const already = (existingRows ?? []).some((row) => {
      const m = row.metadata as { booking_id?: string } | null
      return m?.booking_id === b.id
    })
    if (already) continue

    const vehicles = b.vehicles as unknown as
      | { name: string; brand: string }
      | { name: string; brand: string }[]
      | null
    const v = Array.isArray(vehicles) ? vehicles[0] : vehicles
    const label = v ? (v.name?.trim() || `${v.brand}`.trim() || 'your vehicle') : 'your vehicle'

    await notifyCustomer({
      userId: b.user_id,
      type: 'return_reminder',
      title: 'Return reminder',
      body: `Scheduled return for ${label} is coming up (${new Date(b.return_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}).`,
      metadata: { booking_id: b.id, return_date: b.return_date },
    })

    void enqueueOutboundEmail({
      idempotencyKey: `email:customer_return_reminder:${b.id}`,
      templateKey: 'customer_return_reminder',
      payload: { audience: 'customer', user_id: b.user_id, booking_id: b.id } as Json,
    })

    inserted += 1
  }

  return { scanned: bookings.length, inserted }
}
