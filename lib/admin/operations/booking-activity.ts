import 'server-only'

import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

export async function appendBookingOpsActivity(input: {
  bookingId: string
  actorUserId: string | null
  activityType: string
  summary: string
  payload?: Json
}): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('booking_ops_activity').insert({
      booking_id: input.bookingId,
      actor_user_id: input.actorUserId,
      activity_type: input.activityType,
      summary: input.summary,
      payload: input.payload ?? null,
    })
  } catch {
    // Non-blocking timeline writes.
  }
}
