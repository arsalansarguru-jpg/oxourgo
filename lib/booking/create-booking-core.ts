import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { computeBookingQuote } from '@/lib/booking/pricing'
import { validateTripWindow } from '@/lib/booking/dates'
import { hasVehicleBookingOverlap } from '@/lib/booking/vehicle-overlap'
import { normalizeBookingSource, type BookingSource } from '@/lib/booking/booking-source'
import { isProfileKycApprovedForBooking } from '@/lib/kyc/kyc-booking-eligible'
import { isVehicleAvailableForBooking, parseMoneyIntRupees, type VehicleRow } from '@/lib/fleet/vehicle-mappers'
import { normalizeBookingPaymentMethod } from '@/lib/payments/methods'
import { assertOnlineCheckoutAllowed } from '@/lib/payments/checkout-guard'
import type { Database } from '@/lib/supabase/database.types'

export type InsertBookingCoreInput = {
  vehicleId: string
  userId: string
  pickupAtIso: string
  returnAtIso: string
  pickupLocation: string
  returnLocation: string
  paymentMethod?: string
  bookingSource?: BookingSource
  customerContactId?: string | null
  whatsappConversationId?: string | null
  /** When false, skips KYC check (ops-only flows with explicit acceptance). */
  requireKyc?: boolean
}

export type InsertBookingCoreSuccess = {
  ok: true
  bookingId: string
  totalRupees: number
}

export type InsertBookingCoreFailure = {
  ok: false
  code:
    | 'validation'
    | 'car_unavailable'
    | 'overlap'
    | 'rpc_missing'
    | 'database'
    | 'kyc_required'
  message: string
}

export type InsertBookingCoreResult = InsertBookingCoreSuccess | InsertBookingCoreFailure

/**
 * Shared booking insert used by website, WhatsApp ops, and admin manual flows.
 * Uses the same overlap RPC / fallback and pricing as the public website.
 */
export async function insertBookingCore(
  supabase: SupabaseClient<Database>,
  input: InsertBookingCoreInput,
): Promise<InsertBookingCoreResult> {
  const pickupLocation = input.pickupLocation?.trim()
  const returnLocation = input.returnLocation?.trim()
  if (!pickupLocation || !returnLocation) {
    return { ok: false, code: 'validation', message: 'Pickup and return locations are required.' }
  }

  const dates = validateTripWindow(input.pickupAtIso, input.returnAtIso)
  if (!dates.ok) {
    return { ok: false, code: 'validation', message: dates.message }
  }

  if (input.requireKyc !== false) {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('verification_tier, kyc_status')
      .eq('user_id', input.userId)
      .maybeSingle()

    if (!isProfileKycApprovedForBooking(profileRow)) {
      return {
        ok: false,
        code: 'kyc_required',
        message: 'Complete identity verification before booking.',
      }
    }
  }

  const { data: vehicleRow, error: vehicleErr } = await supabase
    .from('vehicles')
    .select('id,available,price_per_day')
    .eq('id', input.vehicleId)
    .maybeSingle()

  if (vehicleErr) {
    console.error('[insertBookingCore:vehicle]', vehicleErr.message, vehicleErr.code)
    return { ok: false, code: 'database', message: 'Unable to verify this vehicle.' }
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
    return { ok: false, code: 'database', message: 'Could not verify availability.' }
  }
  if (overlap) {
    return {
      ok: false,
      code: 'overlap',
      message: 'Those dates overlap an existing booking. Choose different times.',
    }
  }

  const method = normalizeBookingPaymentMethod(input.paymentMethod)
  if (method === 'online_payment') {
    const gate = assertOnlineCheckoutAllowed()
    if (!gate.ok) {
      return { ok: false, code: 'validation', message: gate.message }
    }
    return {
      ok: false,
      code: 'validation',
      message: 'Online checkout is not available yet. Choose pay at pickup.',
    }
  }

  const bookingSource = normalizeBookingSource(input.bookingSource)

  const insert: Database['public']['Tables']['bookings']['Insert'] = {
    vehicle_id: vehicleRow.id,
    user_id: input.userId,
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
    payment_method: method === 'online_payment' ? 'online_payment' : 'pay_at_pickup',
    payment_status: 'pending',
    amount_due: quote.totalRupees,
    amount_paid: 0,
    booking_source: bookingSource,
    customer_contact_id: input.customerContactId ?? null,
    whatsapp_conversation_id: input.whatsappConversationId ?? null,
  }

  const { data: created, error: insErr } = await supabase.from('bookings').insert(insert).select('id').single()

  if (insErr || !created?.id) {
    console.error('[insertBookingCore:insert]', insErr?.message, insErr?.code)
    return { ok: false, code: 'database', message: 'Could not complete the booking.' }
  }

  return { ok: true, bookingId: created.id, totalRupees: quote.totalRupees }
}
