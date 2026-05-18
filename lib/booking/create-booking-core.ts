import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { computeBookingQuote } from '@/lib/booking/pricing'
import { PICKUP_HUB } from '@/lib/booking/constants'
import { validateTripWindow } from '@/lib/booking/dates'
import { hasVehicleBookingOverlap } from '@/lib/booking/vehicle-overlap'
import { normalizeBookingSource, type BookingSource } from '@/lib/booking/booking-source'
import { isProfileKycApprovedForBooking } from '@/lib/kyc/kyc-booking-eligible'
import { isVehicleAvailableForBooking, parseMoneyIntRupees, type VehicleRow } from '@/lib/fleet/vehicle-mappers'
import { normalizeBookingPaymentMethod } from '@/lib/payments/methods'
import { assertOnlineCheckoutAllowed } from '@/lib/payments/checkout-guard'
import type { Database } from '@/lib/supabase/database.types'

export type BookingPricingOverride = {
  pricePerDayRupees?: number
  subtotalRupees?: number
  convenienceFeeRupees?: number
  gstRupees?: number
  totalRupees?: number
  depositAmountRupees?: number
  customDiscountRupees?: number
}

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
  /** Ops manual booking: skip overlap and availability checks when true (audited). */
  bypassRestrictions?: boolean
  /** Custom line items; partial overrides fall back to computed quote fields. */
  pricingOverride?: BookingPricingOverride
  /** Staff-only note stored on the booking at creation. */
  adminInternalNotes?: string | null
  /** When true, booking is created as confirmed (skips pending_payment). */
  autoConfirm?: boolean
  vipFlag?: boolean
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
  const pickupLocation = input.pickupLocation?.trim() || PICKUP_HUB
  const returnLocation = input.returnLocation?.trim() || PICKUP_HUB

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

  if (!input.bypassRestrictions && !isVehicleAvailableForBooking(vehicleRow as VehicleRow)) {
    return { ok: false, code: 'car_unavailable', message: 'This vehicle is not available to book right now.' }
  }

  const catalogPricePerDay = parseMoneyIntRupees(vehicleRow.price_per_day)
  const pricePerDay =
    input.pricingOverride?.pricePerDayRupees != null
      ? Math.max(0, Math.round(input.pricingOverride.pricePerDayRupees))
      : catalogPricePerDay
  if (pricePerDay <= 0 && input.pricingOverride?.totalRupees == null) {
    return { ok: false, code: 'validation', message: 'Invalid vehicle pricing.' }
  }

  const baseQuote = computeBookingQuote(pricePerDay > 0 ? pricePerDay : catalogPricePerDay, dates.rentalDays)
  const discount = Math.max(0, Math.round(Number(input.pricingOverride?.customDiscountRupees ?? 0)))
  const quote = {
    rentalDays: baseQuote.rentalDays,
    subtotalRupees: input.pricingOverride?.subtotalRupees ?? baseQuote.subtotalRupees,
    convenienceFeeRupees: input.pricingOverride?.convenienceFeeRupees ?? baseQuote.convenienceFeeRupees,
    gstRupees: input.pricingOverride?.gstRupees ?? baseQuote.gstRupees,
    totalRupees:
      input.pricingOverride?.totalRupees ??
      Math.max(0, baseQuote.totalRupees - discount),
  }

  if (!input.bypassRestrictions) {
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

  const depositAmount =
    input.pricingOverride?.depositAmountRupees != null
      ? Math.max(0, Math.round(input.pricingOverride.depositAmountRupees))
      : null

  const insert: Database['public']['Tables']['bookings']['Insert'] = {
    vehicle_id: vehicleRow.id,
    user_id: input.userId,
    pickup_date: input.pickupAtIso,
    return_date: input.returnAtIso,
    pickup_location: pickupLocation,
    return_location: returnLocation,
    rental_days: quote.rentalDays,
    price_per_day_rupees_snapshot: pricePerDay > 0 ? pricePerDay : catalogPricePerDay,
    subtotal_rupees: quote.subtotalRupees,
    convenience_fee_rupees: quote.convenienceFeeRupees,
    gst_rupees: quote.gstRupees,
    total_rupees: quote.totalRupees,
    custom_discount_rupees: discount,
    booking_status: input.autoConfirm ? 'confirmed' : 'pending_payment',
    payment_method: 'pay_at_pickup',
    payment_status: 'pending',
    amount_due: quote.totalRupees,
    amount_paid: 0,
    booking_source: bookingSource,
    customer_contact_id: input.customerContactId ?? null,
    whatsapp_conversation_id: input.whatsappConversationId ?? null,
    admin_internal_notes: input.adminInternalNotes?.trim() || null,
    restrictions_bypass: Boolean(input.bypassRestrictions),
    vip_flag: Boolean(input.vipFlag),
    deposit_amount: depositAmount,
    deposit_held_rupees: depositAmount,
    approved_at: input.autoConfirm ? new Date().toISOString() : null,
  }

  const { data: created, error: insErr } = await supabase.from('bookings').insert(insert).select('id').single()

  if (insErr || !created?.id) {
    console.error('[insertBookingCore:insert]', insErr?.message, insErr?.code)
    return { ok: false, code: 'database', message: 'Could not complete the booking.' }
  }

  return { ok: true, bookingId: created.id, totalRupees: quote.totalRupees }
}
