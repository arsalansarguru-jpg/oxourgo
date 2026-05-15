'use server'

import * as Sentry from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'

import { insertBookingCore } from '@/lib/booking/create-booking-core'
import type { CreateBookingInput, CreateBookingResult } from '@/lib/booking/types'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { onBookingCreated } from '@/lib/notifications/events'
import { createClient } from '@/lib/supabase/server'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'
import { reportBookingCreateFailure } from '@/lib/monitoring/report-booking-failure'

export async function createBookingAction(input: CreateBookingInput): Promise<CreateBookingResult> {
  return runInstrumentedServerAction('createBookingAction', 'booking', async () => {
    const user = await getAuthenticatedUser()
    if (!user) {
      return { ok: false, code: 'unauthorized', message: 'Sign in to complete your reservation.' }
    }

    try {
      const supabase = await createClient()

      const result = await insertBookingCore(supabase, {
        vehicleId: input.carId,
        userId: user.id,
        pickupAtIso: input.pickupAtIso,
        returnAtIso: input.returnAtIso,
        pickupLocation: input.pickupLocation,
        returnLocation: input.returnLocation,
        paymentMethod: input.paymentMethod,
        bookingSource: 'website',
      })

      if (!result.ok) {
        if (result.code === 'rpc_missing') reportBookingCreateFailure('rpc_missing')
        else if (result.code === 'database' || result.code === 'overlap') reportBookingCreateFailure('database')
        const code =
          result.code === 'kyc_required' ||
          result.code === 'validation' ||
          result.code === 'car_unavailable' ||
          result.code === 'overlap' ||
          result.code === 'rpc_missing' ||
          result.code === 'database'
            ? result.code
            : 'unknown'
        return { ok: false, code, message: result.message }
      }

      revalidatePath('/dashboard')
      revalidatePath('/dashboard/bookings')
      revalidatePath(`/booking/${input.carId}`)
      void onBookingCreated(result.bookingId)
      return { ok: true, bookingId: result.bookingId, totalRupees: result.totalRupees }
    } catch (e) {
      console.error('[createBookingAction]', e)
      Sentry.captureException(e instanceof Error ? e : new Error('createBookingAction'), {
        tags: { oxour_domain: 'booking', booking_failure_phase: 'unexpected' },
      })
      return {
        ok: false,
        code: 'unknown',
        message: 'Something went wrong. Please try again.',
      }
    }
  })
}
