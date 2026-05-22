'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { appendBookingOpsActivity } from '@/lib/admin/operations/booking-activity'
import { writeAdminAudit } from '@/lib/admin/audit'
import { requirePermissionForAdminAction } from '@/lib/auth/admin-action-auth'
import { hasPermission } from '@/lib/auth/permissions'
import { insertBookingCore, type BookingPricingOverride } from '@/lib/booking/create-booking-core'
import { computeBookingQuote } from '@/lib/booking/pricing'
import { hasVehicleBookingOverlap } from '@/lib/booking/vehicle-overlap'
import { isProfileKycApprovedForBooking } from '@/lib/kyc/kyc-booking-eligible'
import { parseMoneyIntRupees } from '@/lib/fleet/vehicle-mappers'
import { safeRupees } from '@/lib/money/safe'
import { buildDeductionsSnapshot, penaltyNotesFromJson } from '@/lib/booking/financial'
import { onBookingApproved, onBookingCancelled, onBookingCreated } from '@/lib/notifications/events'
import { adminActionDbFailed } from '@/lib/errors/safe-user-message'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'
import type { Database, Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

const FLEET_MODES = ['available', 'unavailable', 'maintenance', 'service', 'accident_hold'] as const
type FleetMode = (typeof FLEET_MODES)[number]

function nowIso() {
  return new Date().toISOString()
}

async function requireOpsOverride(): Promise<
  | { ok: true; userId: string }
  | { ok: false; message: string }
> {
  const guard = await requirePermissionForAdminAction('ops.override')
  if (!guard.ok) return { ok: false, message: guard.message ?? 'Override permission required.' }
  if (!hasPermission(guard.session.appRole, 'ops.override')) {
    return { ok: false, message: 'Only operations admins may perform this override.' }
  }
  return { ok: true, userId: guard.session.user.id }
}

function parseRupees(n: unknown): number | null {
  const v = Math.round(Number(n))
  if (!Number.isFinite(v) || v < 0 || v > 1_000_000_000) return null
  return v
}

function asCustomerFlags(j: Json | null | undefined): Record<string, boolean> {
  if (!j || typeof j !== 'object' || Array.isArray(j)) return {}
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(j as Record<string, Json>)) {
    out[k] = Boolean(v)
  }
  return out
}

function revalidateBookingPaths(bookingId: string) {
  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/operations')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/bookings')
}

// ---------------------------------------------------------------------------
// Manual booking creation
// ---------------------------------------------------------------------------

export async function adminCreateManualBookingAction(input: {
  userId: string
  vehicleId: string
  pickupAtIso: string
  returnAtIso: string
  pickupLocation: string
  returnLocation: string
  paymentMethod?: string
  requireKyc?: boolean
  bypassRestrictions?: boolean
  autoConfirm?: boolean
  vipFlag?: boolean
  adminInternalNotes?: string | null
  opsNote?: string | null
  pricingOverride?: BookingPricingOverride
}): Promise<AdminActionResult & { bookingId?: string }> {
  return runInstrumentedServerAction('adminCreateManualBookingAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('bookings.write')
    if (!guard.ok) return guard
    const { user } = guard.session

    const bypass = Boolean(input.bypassRestrictions)
    if (bypass) {
      const ov = await requireOpsOverride()
      if (!ov.ok) return { ok: false, message: ov.message }
    }

    const admin = createAdminClient()
    const result = await insertBookingCore(admin, {
      vehicleId: input.vehicleId,
      userId: input.userId,
      pickupAtIso: input.pickupAtIso,
      returnAtIso: input.returnAtIso,
      pickupLocation: input.pickupLocation,
      returnLocation: input.returnLocation,
      paymentMethod: input.paymentMethod ?? 'pay_at_pickup',
      bookingSource: 'admin_manual',
      requireKyc: input.requireKyc,
      bypassRestrictions: bypass,
      pricingOverride: input.pricingOverride,
      adminInternalNotes: input.adminInternalNotes,
      autoConfirm: input.autoConfirm,
      vipFlag: input.vipFlag,
    })

    if (!result.ok) {
      return { ok: false, message: result.message }
    }

    const ts = nowIso()
    if (input.opsNote?.trim()) {
      await admin.from('bookings').update({ ops_note: input.opsNote.trim(), updated_at: ts }).eq('id', result.bookingId)
    }
    if (input.autoConfirm) {
      await admin
        .from('bookings')
        .update({ approved_by: user.id, approved_at: ts, updated_at: ts })
        .eq('id', result.bookingId)
    }

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.create_manual',
      entityType: 'booking',
      entityId: result.bookingId,
      payload: {
        user_id: input.userId,
        vehicle_id: input.vehicleId,
        bypass_restrictions: bypass,
        auto_confirm: Boolean(input.autoConfirm),
        total_rupees: result.totalRupees,
      },
    })

    await appendBookingOpsActivity({
      bookingId: result.bookingId,
      actorUserId: user.id,
      activityType: 'manual_create',
      summary: 'Manual booking created by staff',
      payload: { total_rupees: result.totalRupees, bypass_restrictions: bypass },
    })

    void onBookingCreated(result.bookingId)
    if (input.autoConfirm) void onBookingApproved(result.bookingId)

    revalidateBookingPaths(result.bookingId)
    return { ok: true, bookingId: result.bookingId }
  })
}

// ---------------------------------------------------------------------------
// Booking overrides
// ---------------------------------------------------------------------------

export async function adminForceConfirmBookingAction(
  bookingId: string,
  reason?: string,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminForceConfirmBookingAction', 'admin', async () => {
    const ov = await requireOpsOverride()
    if (!ov.ok) return { ok: false, message: ov.message }

    const admin = createAdminClient()
    const { data: row, error: fetchErr } = await admin
      .from('bookings')
      .select('booking_status, vehicle_id, pickup_date, return_date, ops_hold_at, restrictions_bypass, user_id')
      .eq('id', bookingId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
    if (row.ops_hold_at) return { ok: false, message: 'Release the ops hold before force confirming.' }
    if (row.booking_status === 'cancelled' || row.booking_status === 'completed') {
      return { ok: false, message: 'Cannot force confirm a terminal booking.' }
    }
    if (row.booking_status === 'confirmed' || row.booking_status === 'active') return { ok: true }

    if (row.vehicle_id && !row.restrictions_bypass) {
      const { overlap } = await hasVehicleBookingOverlap(
        row.vehicle_id,
        row.pickup_date,
        row.return_date,
        bookingId,
        admin,
      )
      if (overlap) {
        return {
          ok: false,
          message: 'Vehicle overlap detected. Enable bypass restrictions or swap vehicle first.',
        }
      }
    }

    if (!row.restrictions_bypass && row.user_id) {
      const { data: prof } = await admin
        .from('profiles')
        .select('verification_tier, kyc_status')
        .eq('user_id', row.user_id)
        .maybeSingle()
      if (!isProfileKycApprovedForBooking(prof)) {
        return {
          ok: false,
          message: 'Customer KYC must be approved before force confirming. Enable restrictions bypass for ops override.',
        }
      }
    }

    const ts = nowIso()
    const { error } = await admin
      .from('bookings')
      .update({
        booking_status: 'confirmed',
        approved_at: ts,
        approved_by: ov.userId,
        updated_at: ts,
      })
      .eq('id', bookingId)

    if (error) return adminActionDbFailed('adminForceConfirmBookingAction', error)

    await writeAdminAudit({
      actorUserId: ov.userId,
      action: 'booking.force_confirm',
      entityType: 'booking',
      entityId: bookingId,
      payload: { reason: reason?.trim() ?? null },
    })
    await appendBookingOpsActivity({
      bookingId,
      actorUserId: ov.userId,
      activityType: 'force_confirm',
      summary: reason?.trim() ? `Force confirmed: ${reason.trim()}` : 'Force confirmed by ops',
    })

    void onBookingApproved(bookingId)
    revalidateBookingPaths(bookingId)
    return { ok: true }
  })
}

export async function adminEmergencyCancelBookingAction(
  bookingId: string,
  reason: string,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminEmergencyCancelBookingAction', 'admin', async () => {
    const ov = await requireOpsOverride()
    if (!ov.ok) return { ok: false, message: ov.message }
    const note = reason?.trim()
    if (!note) return { ok: false, message: 'Emergency cancellation requires a reason.' }

    const admin = createAdminClient()
    const { data: row, error: fetchErr } = await admin.from('bookings').select('booking_status').eq('id', bookingId).single()
    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
    if (row.booking_status === 'cancelled') return { ok: true }

    const ts = nowIso()
    const { error } = await admin
      .from('bookings')
      .update({
        booking_status: 'cancelled',
        ops_note: note,
        ops_hold_at: null,
        ops_hold_reason: null,
        updated_at: ts,
      })
      .eq('id', bookingId)

    if (error) return adminActionDbFailed('adminEmergencyCancelBookingAction', error)

    await writeAdminAudit({
      actorUserId: ov.userId,
      action: 'booking.emergency_cancel',
      entityType: 'booking',
      entityId: bookingId,
      payload: { reason: note },
    })
    await appendBookingOpsActivity({
      bookingId,
      actorUserId: ov.userId,
      activityType: 'emergency_cancel',
      summary: `Emergency cancelled: ${note}`,
    })

    void onBookingCancelled(bookingId, note)
    revalidateBookingPaths(bookingId)
    return { ok: true }
  })
}

export async function adminSetBookingHoldAction(input: {
  bookingId: string
  onHold: boolean
  reason?: string | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSetBookingHoldAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('bookings.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()
    const ts = nowIso()

    const patch: Database['public']['Tables']['bookings']['Update'] = {
      updated_at: ts,
      ops_hold_at: input.onHold ? ts : null,
      ops_hold_reason: input.onHold ? input.reason?.trim() || 'On hold' : null,
    }

    const { error } = await admin.from('bookings').update(patch).eq('id', input.bookingId)
    if (error) return adminActionDbFailed('adminSetBookingHoldAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: input.onHold ? 'booking.hold' : 'booking.hold_release',
      entityType: 'booking',
      entityId: input.bookingId,
      payload: { reason: input.reason?.trim() ?? null },
    })
    await appendBookingOpsActivity({
      bookingId: input.bookingId,
      actorUserId: user.id,
      activityType: input.onHold ? 'hold' : 'hold_release',
      summary: input.onHold
        ? `Booking placed on hold${input.reason?.trim() ? `: ${input.reason.trim()}` : ''}`
        : 'Ops hold released',
    })

    revalidateBookingPaths(input.bookingId)
    return { ok: true }
  })
}

export async function adminSetBookingRestrictionsBypassAction(
  bookingId: string,
  bypass: boolean,
  reason?: string,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSetBookingRestrictionsBypassAction', 'admin', async () => {
    const ov = await requireOpsOverride()
    if (!ov.ok) return { ok: false, message: ov.message }

    const admin = createAdminClient()
    const { error } = await admin
      .from('bookings')
      .update({ restrictions_bypass: bypass, updated_at: nowIso() })
      .eq('id', bookingId)

    if (error) return adminActionDbFailed('adminSetBookingRestrictionsBypassAction', error)

    await writeAdminAudit({
      actorUserId: ov.userId,
      action: bypass ? 'booking.restrictions_bypass_on' : 'booking.restrictions_bypass_off',
      entityType: 'booking',
      entityId: bookingId,
      payload: { reason: reason?.trim() ?? null },
    })
    await appendBookingOpsActivity({
      bookingId,
      actorUserId: ov.userId,
      activityType: 'restrictions_bypass',
      summary: bypass ? 'Restriction bypass enabled' : 'Restriction bypass disabled',
      payload: { reason: reason?.trim() ?? null },
    })

    revalidateBookingPaths(bookingId)
    return { ok: true }
  })
}

// ---------------------------------------------------------------------------
// Vehicle swap
// ---------------------------------------------------------------------------

export async function adminSwapBookingVehicleAction(input: {
  bookingId: string
  newVehicleId: string
  reason?: string | null
  recalculatePricing?: boolean
  bypassOverlap?: boolean
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSwapBookingVehicleAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('bookings.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin
      .from('bookings')
      .select(
        'vehicle_id, user_id, pickup_date, return_date, rental_days, booking_status, restrictions_bypass, total_rupees, price_per_day_rupees_snapshot, amount_paid',
      )
      .eq('id', input.bookingId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
    if (!row.vehicle_id) return { ok: false, message: 'Booking has no current vehicle.' }
    if (row.vehicle_id === input.newVehicleId) return { ok: true }

    if (!row.restrictions_bypass && row.user_id) {
      const { data: prof } = await admin
        .from('profiles')
        .select('verification_tier, kyc_status')
        .eq('user_id', row.user_id)
        .maybeSingle()
      if (!isProfileKycApprovedForBooking(prof)) {
        return {
          ok: false,
          message: 'Customer KYC must be approved before allocating a vehicle. Enable restrictions bypass for ops override.',
        }
      }
    }

    const bypass = Boolean(input.bypassOverlap) || Boolean(row.restrictions_bypass)
    if (!bypass) {
      const { overlap } = await hasVehicleBookingOverlap(
        input.newVehicleId,
        row.pickup_date,
        row.return_date,
        input.bookingId,
        admin,
      )
      if (overlap) {
        return {
          ok: false,
          message: 'New vehicle is not available for these dates. Enable bypass restrictions or confirm overlap override.',
        }
      }
    } else if (input.bypassOverlap) {
      const ov = await requireOpsOverride()
      if (!ov.ok) return { ok: false, message: ov.message }
    }

    const { data: newVehicle, error: vehErr } = await admin
      .from('vehicles')
      .select('id, price_per_day, security_deposit')
      .eq('id', input.newVehicleId)
      .maybeSingle()

    if (vehErr || !newVehicle) return { ok: false, message: 'Replacement vehicle not found.' }

    const previousTotal = safeRupees(row.total_rupees)
    let newTotal = previousTotal
    const patch: Database['public']['Tables']['bookings']['Update'] = {
      vehicle_id: input.newVehicleId,
      updated_at: nowIso(),
    }

    if (input.recalculatePricing) {
      const pricePerDay = parseMoneyIntRupees(newVehicle.price_per_day)
      const quote = computeBookingQuote(pricePerDay, row.rental_days)
      const discount = 0
      newTotal = Math.max(0, quote.totalRupees - discount)
      patch.price_per_day_rupees_snapshot = pricePerDay
      patch.subtotal_rupees = quote.subtotalRupees
      patch.convenience_fee_rupees = quote.convenienceFeeRupees
      patch.gst_rupees = quote.gstRupees
      const paid = safeRupees(row.amount_paid)
      patch.total_rupees = newTotal
      patch.amount_due = Math.max(0, newTotal - paid)
      patch.deposit_amount = parseMoneyIntRupees(newVehicle.security_deposit)
      patch.deposit_held_rupees = patch.deposit_amount
    }

    const { error: updErr } = await admin.from('bookings').update(patch).eq('id', input.bookingId)
    if (updErr) return adminActionDbFailed('adminSwapBookingVehicleAction', updErr)

    await admin.from('booking_vehicle_assignments').insert({
      booking_id: input.bookingId,
      from_vehicle_id: row.vehicle_id,
      to_vehicle_id: input.newVehicleId,
      changed_by: user.id,
      reason: input.reason?.trim() || null,
      recalculate_pricing: Boolean(input.recalculatePricing),
      previous_total_rupees: previousTotal,
      new_total_rupees: input.recalculatePricing ? newTotal : null,
    })

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.vehicle_swap',
      entityType: 'booking',
      entityId: input.bookingId,
      payload: {
        from_vehicle_id: row.vehicle_id,
        to_vehicle_id: input.newVehicleId,
        recalculate_pricing: Boolean(input.recalculatePricing),
      },
    })
    await appendBookingOpsActivity({
      bookingId: input.bookingId,
      actorUserId: user.id,
      activityType: 'vehicle_swap',
      summary: input.reason?.trim() ? `Vehicle swapped: ${input.reason.trim()}` : 'Vehicle assignment changed',
      payload: {
        from_vehicle_id: row.vehicle_id,
        to_vehicle_id: input.newVehicleId,
        previous_total_rupees: previousTotal,
        new_total_rupees: input.recalculatePricing ? newTotal : null,
      },
    })

    revalidateBookingPaths(input.bookingId)
    revalidatePath('/admin/fleet')
    return { ok: true }
  })
}

// ---------------------------------------------------------------------------
// Fleet emergency controls
// ---------------------------------------------------------------------------

export async function adminSetVehicleFleetModeAction(input: {
  vehicleId: string
  mode: string
  opsNote?: string | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSetVehicleFleetModeAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('fleet.write')
    if (!guard.ok) return guard
    const { user } = guard.session

    const mode = input.mode.trim().toLowerCase() as FleetMode
    if (!(FLEET_MODES as readonly string[]).includes(mode)) {
      return { ok: false, message: 'Invalid fleet mode.' }
    }

    const available = mode === 'available'
    const patch: Database['public']['Tables']['vehicles']['Update'] = {
      availability_status: mode,
      available,
      fleet_ops_note: input.opsNote?.trim() || null,
    }

    const admin = createAdminClient()
    const { error } = await admin.from('vehicles').update(patch).eq('id', input.vehicleId)
    if (error) return adminActionDbFailed('adminSetVehicleFleetModeAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'fleet.mode',
      entityType: 'vehicle',
      entityId: input.vehicleId,
      payload: { mode, ops_note: input.opsNote?.trim() ?? null },
    })

    revalidatePath('/admin/fleet')
    revalidatePath('/admin/operations')
    revalidatePath('/fleet')
    return { ok: true }
  })
}

// ---------------------------------------------------------------------------
// Internal notes & customer flags
// ---------------------------------------------------------------------------

export async function adminAppendBookingOpsNoteAction(input: {
  bookingId: string
  note: string
  category?: 'private' | 'operational' | 'customer_flag'
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminAppendBookingOpsNoteAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('bookings.write')
    if (!guard.ok) return guard
    const text = input.note?.trim()
    if (!text) return { ok: false, message: 'Note cannot be empty.' }

    const admin = createAdminClient()
    const category = input.category ?? 'operational'
    const prefix =
      category === 'private' ? '[Private] ' : category === 'customer_flag' ? '[Flag] ' : '[Ops] '
    const stamped = `${prefix}${text}`

    const { data: row, error: fetchErr } = await admin
      .from('bookings')
      .select('admin_internal_notes')
      .eq('id', input.bookingId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }

    const existing = row.admin_internal_notes?.trim()
    const merged = existing ? `${existing}\n\n${stamped}` : stamped
    const ts = nowIso()

    const { error } = await admin
      .from('bookings')
      .update({ admin_internal_notes: merged, updated_at: ts })
      .eq('id', input.bookingId)

    if (error) return adminActionDbFailed('adminAppendBookingOpsNoteAction', error)

    await appendBookingOpsActivity({
      bookingId: input.bookingId,
      actorUserId: guard.session.user.id,
      activityType: `note_${category}`,
      summary: stamped,
    })

    await writeAdminAudit({
      actorUserId: guard.session.user.id,
      action: 'booking.ops_note',
      entityType: 'booking',
      entityId: input.bookingId,
      payload: { category },
    })

    revalidateBookingPaths(input.bookingId)
    return { ok: true }
  })
}

export async function adminSetBookingCustomerFlagsAction(input: {
  bookingId: string
  vip?: boolean
  flags?: Record<string, boolean>
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSetBookingCustomerFlagsAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('bookings.write')
    if (!guard.ok) return guard
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin
      .from('bookings')
      .select('customer_flags')
      .eq('id', input.bookingId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }

    const merged = { ...asCustomerFlags(row.customer_flags), ...input.flags }
    const patch: Database['public']['Tables']['bookings']['Update'] = {
      customer_flags: merged as Json,
      updated_at: nowIso(),
    }
    if (input.vip !== undefined) patch.vip_flag = input.vip

    const { error } = await admin.from('bookings').update(patch).eq('id', input.bookingId)
    if (error) return adminActionDbFailed('adminSetBookingCustomerFlagsAction', error)

    await writeAdminAudit({
      actorUserId: guard.session.user.id,
      action: 'booking.customer_flags',
      entityType: 'booking',
      entityId: input.bookingId,
      payload: { vip: input.vip, flags: input.flags ?? null },
    })

    revalidateBookingPaths(input.bookingId)
    return { ok: true }
  })
}

// ---------------------------------------------------------------------------
// Financial overrides
// ---------------------------------------------------------------------------

export async function adminApplyBookingDiscountAction(input: {
  bookingId: string
  discountRupees: number
  note?: string | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminApplyBookingDiscountAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('payments.write')
    if (!guard.ok) return guard

    const discount = parseRupees(input.discountRupees)
    if (discount == null) return { ok: false, message: 'Invalid discount amount.' }

    const admin = createAdminClient()
    const { data: row, error: fetchErr } = await admin
      .from('bookings')
      .select('subtotal_rupees, convenience_fee_rupees, gst_rupees, total_rupees, amount_paid')
      .eq('id', input.bookingId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }

    const baseTotal =
      safeRupees(row.subtotal_rupees) + safeRupees(row.convenience_fee_rupees) + safeRupees(row.gst_rupees)
    const newTotal = Math.max(0, baseTotal - discount)
    const paid = safeRupees(row.amount_paid)

    const { error } = await admin
      .from('bookings')
      .update({
        custom_discount_rupees: discount,
        total_rupees: newTotal,
        amount_due: Math.max(0, newTotal - paid),
        financial_manual_override: true,
        updated_at: nowIso(),
      })
      .eq('id', input.bookingId)

    if (error) return adminActionDbFailed('adminApplyBookingDiscountAction', error)

    await writeAdminAudit({
      actorUserId: guard.session.user.id,
      action: 'booking.discount',
      entityType: 'booking',
      entityId: input.bookingId,
      payload: { discount_rupees: discount, note: input.note?.trim() ?? null },
    })
    await appendBookingOpsActivity({
      bookingId: input.bookingId,
      actorUserId: guard.session.user.id,
      activityType: 'discount',
      summary: `Custom discount applied: ₹${discount}`,
      payload: { new_total_rupees: newTotal },
    })

    revalidateBookingPaths(input.bookingId)
    revalidatePath('/admin/payments')
    return { ok: true }
  })
}

export async function adminWaiveBookingPenaltiesAction(input: {
  bookingId: string
  note?: string | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminWaiveBookingPenaltiesAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('penalties.write')
    if (!guard.ok) return guard

    const admin = createAdminClient()
    const { data: row, error: fetchErr } = await admin
      .from('bookings')
      .select(
        'deposit_amount, deposit_held_rupees, penalty_late_rupees, penalty_fuel_rupees, penalty_extra_km_rupees, penalty_cleaning_rupees, penalty_damage_rupees, penalty_traffic_rupees, penalty_notes',
      )
      .eq('id', input.bookingId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }

    const depositAmount = Math.round(Number(row.deposit_amount ?? row.deposit_held_rupees ?? 0))
    const snapshot = buildDeductionsSnapshot({
      amounts: {
        penaltyLateRupees: 0,
        penaltyFuelRupees: 0,
        penaltyExtraKmRupees: 0,
        penaltyCleaningRupees: 0,
        penaltyDamageRupees: 0,
        penaltyTrafficRupees: 0,
      },
      depositAmountRupees: depositAmount,
      depositAppliedRupees: 0,
      manualOverride: true,
      notes: penaltyNotesFromJson(row.penalty_notes),
    })

    const { error } = await admin
      .from('bookings')
      .update({
        penalty_late_rupees: 0,
        penalty_fuel_rupees: 0,
        penalty_extra_km_rupees: 0,
        penalty_cleaning_rupees: 0,
        penalty_damage_rupees: 0,
        penalty_traffic_rupees: 0,
        penalty_total: 0,
        deposit_penalty_total_rupees: 0,
        refund_amount: snapshot.refundable_balance_rupees,
        deductions: snapshot as unknown as Json,
        financial_manual_override: true,
        updated_at: nowIso(),
      })
      .eq('id', input.bookingId)

    if (error) return adminActionDbFailed('adminWaiveBookingPenaltiesAction', error)

    await writeAdminAudit({
      actorUserId: guard.session.user.id,
      action: 'booking.penalties_waived',
      entityType: 'booking',
      entityId: input.bookingId,
      payload: { note: input.note?.trim() ?? null },
    })
    await appendBookingOpsActivity({
      bookingId: input.bookingId,
      actorUserId: guard.session.user.id,
      activityType: 'penalties_waived',
      summary: input.note?.trim() ? `Penalties waived: ${input.note.trim()}` : 'All penalties waived',
    })

    revalidateBookingPaths(input.bookingId)
    revalidatePath('/admin/financials')
    return { ok: true }
  })
}

export async function adminManualRentalRefundAction(input: {
  bookingId: string
  refundRupees: number
  note?: string | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminManualRentalRefundAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('refunds.write')
    if (!guard.ok) return guard

    const refund = parseRupees(input.refundRupees)
    if (refund == null || refund <= 0) return { ok: false, message: 'Invalid refund amount.' }

    const admin = createAdminClient()
    const { data: row, error: fetchErr } = await admin
      .from('bookings')
      .select('user_id, amount_paid, total_rupees, payment_status')
      .eq('id', input.bookingId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
    const paid = safeRupees(row.amount_paid)
    if (refund > paid) {
      return { ok: false, message: 'Refund cannot exceed amount collected on the rental.' }
    }

    const ts = nowIso()
    const { error } = await admin
      .from('bookings')
      .update({
        payment_status: 'refunded',
        amount_paid: Math.max(0, paid - refund),
        amount_due: Math.max(0, safeRupees(row.total_rupees) - Math.max(0, paid - refund)),
        payment_notes: input.note?.trim() || null,
        financial_manual_override: true,
        updated_at: ts,
      })
      .eq('id', input.bookingId)

    if (error) return adminActionDbFailed('adminManualRentalRefundAction', error)

    const metadata: Json = {
      source: 'admin_manual_refund',
      refund_amount_rupees: refund,
      note: input.note?.trim() || null,
    }

    const { error: ledgerErr } = await admin.from('payment_events').insert({
      user_id: row.user_id,
      booking_id: input.bookingId,
      title: 'Manual rental refund (ops)',
      amount_rupees: refund,
      direction: 'credit',
      status: 'posted',
      metadata,
    })
    if (ledgerErr) return adminActionDbFailed('adminManualRentalRefundAction:ledger', ledgerErr)

    await writeAdminAudit({
      actorUserId: guard.session.user.id,
      action: 'booking.manual_rental_refund',
      entityType: 'booking',
      entityId: input.bookingId,
      payload: { refund_rupees: refund },
    })
    await appendBookingOpsActivity({
      bookingId: input.bookingId,
      actorUserId: guard.session.user.id,
      activityType: 'manual_refund',
      summary: `Manual rental refund: ₹${refund}`,
    })

    revalidateBookingPaths(input.bookingId)
    revalidatePath('/admin/payments')
    return { ok: true }
  })
}
