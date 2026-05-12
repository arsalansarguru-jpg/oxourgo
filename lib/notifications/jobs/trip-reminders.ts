import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { notifyCustomer } from '@/lib/notifications/emit'

/**
 * Trip reminders for confirmed bookings with pickup in the configured hour window.
 * Call from a secured cron HTTP route or external scheduler.
 */
export async function runTripReminderJob(options?: { hoursMin?: number; hoursMax?: number }): Promise<{
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
    .select('id, user_id, pickup_at, cars(brand,model)')
    .eq('booking_status', 'confirmed')
    .gte('pickup_at', from)
    .lte('pickup_at', to)

  if (error || !bookings?.length) return { scanned: 0, inserted: 0 }

  let inserted = 0
  for (const b of bookings) {
    const { data: existingRows } = await admin
      .from('notifications')
      .select('metadata')
      .eq('user_id', b.user_id)
      .eq('type', 'trip_reminder')

    const already = (existingRows ?? []).some((row) => {
      const m = row.metadata as { booking_id?: string } | null
      return m?.booking_id === b.id
    })
    if (already) continue

    const cars = b.cars as { brand: string; model: string } | { brand: string; model: string }[] | null
    const c = Array.isArray(cars) ? cars[0] : cars
    const label = c ? `${c.brand} ${c.model}`.trim() : 'your vehicle'

    await notifyCustomer({
      userId: b.user_id,
      type: 'trip_reminder',
      title: 'Upcoming trip reminder',
      body: `Pickup for ${label} is scheduled soon (${new Date(b.pickup_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}).`,
      metadata: { booking_id: b.id, pickup_at: b.pickup_at },
    })
    inserted += 1
  }

  return { scanned: bookings.length, inserted }
}
