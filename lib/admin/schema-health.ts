import 'server-only'

import { logAdminQueryResult } from '@/lib/admin/debug-query'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Probes critical booking columns once per process when OXOUR_ADMIN_DATA_DEBUG=1.
 * Surfaces schema drift before list queries fail silently.
 */
let schemaProbeDone = false

export async function probeAdminBookingSchema(): Promise<void> {
  if (schemaProbeDone) return
  schemaProbeDone = true
  if (process.env.OXOUR_ADMIN_DATA_DEBUG !== '1') return

  const admin = createAdminClient()
  const { error } = await admin
    .from('bookings')
    .select('id, payment_method, payment_status, amount_due, amount_paid, booking_source')
    .is('deleted_at', null)
    .limit(1)

  logAdminQueryResult('schema.probe.bookings', {
    rowCount: error ? 0 : 1,
    error,
    meta: {
      hint: error
        ? 'Run supabase migration 20260627120000_production_schema_alignment.sql on production'
        : 'booking payment columns OK',
    },
  })
}
