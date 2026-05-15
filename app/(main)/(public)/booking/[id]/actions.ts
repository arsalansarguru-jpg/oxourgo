'use server'

import type { CreateBookingInput, CreateBookingResult } from '@/lib/booking/types'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'

/** Website bookings are concierge-led — avoids partial writes while checkout is finalized. */
export async function createBookingAction(input: CreateBookingInput): Promise<CreateBookingResult> {
  return runInstrumentedServerAction('createBookingAction', 'booking', async () => {
    void input
    return {
      ok: false,
      code: 'concierge_only',
      message: 'Online checkout is concierge-led — please complete your booking on WhatsApp.',
    }
  })
}
