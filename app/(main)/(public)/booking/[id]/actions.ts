'use server'

import { revalidatePath } from 'next/cache'

import { computeBookingQuote } from '@/lib/booking/pricing'
import { validateTripWindow } from '@/lib/booking/dates'
import { hasVehicleBookingOverlap } from '@/lib/booking/vehicle-overlap'
import type { CreateBookingInput, CreateBookingResult } from '@/lib/booking/types'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { onBookingCreated } from '@/lib/notifications/events'
import { isProfileKycApprovedForBooking } from '@/lib/kyc/kyc-booking-eligible'
import { createClient } from '@/lib/supabase/server'
import { isVehicleAvailableForBooking, parseMoneyIntRupees, type VehicleRow } from '@/lib/fleet/vehicle-mappers'
import type { Database } from '@/lib/supabase/database.types'

export async function createBookingAction(input: CreateBookingInput): Promise<CreateBookingResult> {
  const user = await getAuthenticatedUser()
  if (!user) {
    return { ok: false, code: 'unauthorized', message: 'Sign in to complete your reservation.' }
  }

  const pickupLocation = input.pickupLocation?.trim()
  const returnLocation = input.returnLocation?.trim()
  if (!pickupLocation || !returnLocation) {
    return { ok: false, code: 'validation', message: 'Pickup and return locations are required.' }
  }

  const dates = validateTripWindow(input.pickupAtIso, input.returnAtIso)
  if (!dates.ok) {
    return { ok: false, code: 'validation', message: dates.message }
  }

  try {
    const supabase = await createClient()

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('verification_tier, kyc_status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!isProfileKycApprovedForBooking(profileRow)) {
      return {
        ok: false,
        code: 'kyc_required',
        message: 'Complete identity verification to book a vehicle.',
      }
    }

    const { data: vehicleRow, error: vehicleErr } = await supabase
      .from('vehicles')
      .select('id,available,price_per_day')
      .eq('id', input.carId)
      .maybeSingle()

    if (vehicleErr) {
      console.error('[createBookingAction:vehicle]', vehicleErr.message, vehicleErr.code)
      return { ok: false, code: 'database', message: 'Unable to verify this vehicle. Please try again.' }
    }
    if (!vehicleRow) {
      return { ok: false, code: 'validation', message: 'Vehicle not found or no longer listed.' }
    }

    if (!isVehicleAvailableForBooking(vehicleRow as VehicleRow)) {
      return { ok: false, code: 'car_unavailable', message: 'This vehicle is not available to book right now.' }
    }

    const pricePerDay = parseMoneyIntRupees(vehicleRow.price_per_day)
    if (pricePerDay <= 0) {
      return { ok: false, code: 'validation', message: 'Invalid vehicle pricing.' }
    }

    const quote = computeBookingQuote(pricePerDay, dates.rentalDays)

    const { overlap, error: overlapErr } = await hasVehicleBookingOverlap(
      vehicleRow.id,
      input.pickupAtIso,
      input.returnAtIso,
      null,
      supabase,
    )
    if (overlapErr === 'overlap_rpc_missing') {
      return {
        ok: false,
        code: 'rpc_missing',
        message: 'Reservations are temporarily unavailable. Please try again shortly.',
      }
    }
    if (overlapErr) {
      return { ok: false, code: 'database', message: 'Could not verify availability. Please try again.' }
    }
    if (overlap) {
      return {
        ok: false,
        code: 'overlap',
        message: 'Those dates overlap an existing booking. Choose different times.',
      }
    }

    const insert: Database['public']['Tables']['bookings']['Insert'] = {
      vehicle_id: vehicleRow.id,
      user_id: user.id,
      pickup_date: input.pickupAtIso,
      return_date: input.returnAtIso,
      pickup_location: pickupLocation,
      return_location: returnLocation,
      rental_days: quote.rentalDays,
      price_per_day_rupees_snapshot: pricePerDay,
      subtotal_rupees: quote.subtotalRupees,
      convenience_fee_rupees: quote.convenienceFeeRupees,
      gst_rupees: quote.gstRupees,
      total_rupees: quote.totalRupees,
      booking_status: 'pending_payment',
      payment_status: 'pending',
    }

    const { data: created, error: insErr } = await supabase.from('bookings').insert(insert).select('id').single()

    if (insErr || !created?.id) {
      console.error('[createBookingAction:insert]', insErr?.message, insErr?.code)
      return {
        ok: false,
        code: 'database',
        message: 'Could not complete your booking. Please try again.',
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    revalidatePath(`/booking/${input.carId}`)
    void onBookingCreated(created.id)
    return { ok: true, bookingId: created.id, totalRupees: quote.totalRupees }
  } catch (e) {
    console.error('[createBookingAction]', e)
    return {
      ok: false,
      code: 'unknown',
      message: 'Something went wrong. Please try again.',
    }
  }
}
