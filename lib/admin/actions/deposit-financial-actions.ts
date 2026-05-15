'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { insertInspectionEvent } from '@/lib/admin/actions/booking-inspection-actions'
import {
  buildDeductionsSnapshot,
  computePenaltyTotal,
  penaltyAmountsFromBooking,
  penaltyNotesFromJson,
  penaltyNotesToJson,
  resolveDepositAmount,
  type PenaltyCategory,
} from '@/lib/booking/financial'
import { requireAppRole } from '@/lib/auth/server'
import { adminActionDbFailed } from '@/lib/errors/safe-user-message'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'
import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

function nowIso() {
  return new Date().toISOString()
}

function parsePenaltyAmount(n: unknown): number | null {
  const v = Math.round(Number(n))
  if (!Number.isFinite(v) || v < 0 || v > 1_000_000_000) return null
  return v
}

async function loadBookingFinancialRow(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data, error } = await admin
    .from('bookings')
    .select(
      `
      id,
      user_id,
      vehicle_id,
      booking_status,
      deposit_amount,
      deposit_held_rupees,
      deposit_status,
      deposit_refunded_at,
      deposit_refunded_rupees,
      refund_amount,
      penalty_total,
      deposit_penalty_total_rupees,
      financial_manual_override,
      penalty_late_rupees,
      penalty_fuel_rupees,
      penalty_extra_km_rupees,
      penalty_cleaning_rupees,
      penalty_damage_rupees,
      penalty_traffic_rupees,
      penalty_notes,
      deductions
    `,
    )
    .eq('id', bookingId)
    .single()

  if (error || !data) return null

  let vehicleSecurityDeposit = 0
  if (data.vehicle_id) {
    const { data: vehicle } = await admin.from('vehicles').select('security_deposit').eq('id', data.vehicle_id).maybeSingle()
    if (vehicle) {
      vehicleSecurityDeposit = Number(vehicle.security_deposit ?? 0)
    } else {
      const { data: car } = await admin.from('cars').select('security_deposit').eq('id', data.vehicle_id).maybeSingle()
      vehicleSecurityDeposit = Number(car?.security_deposit ?? 0)
    }
  }

  return { ...data, vehicle_security_deposit: vehicleSecurityDeposit }
}

function vehicleDepositFromRow(row: { vehicle_security_deposit?: number }) {
  return Number(row.vehicle_security_deposit ?? 0)
}

export async function adminRecomputeBookingFinancialsAction(
  bookingId: string,
  options?: { manualDepositAppliedRupees?: number | null; manualOverride?: boolean },
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminRecomputeBookingFinancialsAction', 'payments', async () => {
    await requireAppRole('ops_admin')
    const admin = createAdminClient()
    const row = await loadBookingFinancialRow(admin, bookingId)
    if (!row) return { ok: false, message: 'Booking not found.' }
    if (row.booking_status === 'cancelled') {
      return { ok: false, message: 'Financials cannot be updated on a cancelled booking.' }
    }

    const depositAmount = resolveDepositAmount({
      deposit_amount: row.deposit_amount,
      deposit_held_rupees: row.deposit_held_rupees,
      vehicle_security_deposit: vehicleDepositFromRow(row),
    })
    const amounts = penaltyAmountsFromBooking(row)
    const notes = penaltyNotesFromJson(row.penalty_notes)
    const manualOverride = options?.manualOverride ?? row.financial_manual_override
    const depositAppliedOverride =
      options?.manualDepositAppliedRupees ?? (manualOverride ? row.deposit_penalty_total_rupees : null)

    const snapshot = buildDeductionsSnapshot({
      amounts,
      depositAmountRupees: depositAmount,
      depositAppliedRupees: depositAppliedOverride,
      manualOverride,
      notes,
    })

    const ts = nowIso()
    const { error } = await admin
      .from('bookings')
      .update({
        deposit_amount: depositAmount,
        penalty_total: snapshot.penalty_total_rupees,
        deposit_penalty_total_rupees: snapshot.deposit_applied_rupees,
        refund_amount: snapshot.refundable_balance_rupees,
        deductions: snapshot as unknown as Json,
        financial_manual_override: manualOverride,
        updated_at: ts,
      })
      .eq('id', bookingId)

    if (error) return adminActionDbFailed('adminRecomputeBookingFinancialsAction', error)

    revalidateFinancialPaths(bookingId)
    return { ok: true }
  })
}

function revalidateFinancialPaths(bookingId: string) {
  revalidatePath('/admin/financials')
  revalidatePath('/admin/payments')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/dashboard/bookings')
  revalidatePath(`/dashboard/bookings/${bookingId}`)
  revalidatePath('/dashboard/payments')
}

export async function adminMarkDepositReceivedAction(input: {
  bookingId: string
  depositAmountRupees?: number | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminMarkDepositReceivedAction', 'payments', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()
    const row = await loadBookingFinancialRow(admin, input.bookingId)
    if (!row) return { ok: false, message: 'Booking not found.' }
    if (row.booking_status === 'cancelled') {
      return { ok: false, message: 'Deposit cannot be recorded on a cancelled booking.' }
    }
    if (row.deposit_status === 'refunded' || row.deposit_status === 'withheld') {
      return { ok: false, message: 'Deposit is already closed for this booking.' }
    }

    const amount =
      input.depositAmountRupees != null
        ? parsePenaltyAmount(input.depositAmountRupees)
        : resolveDepositAmount({
            deposit_amount: row.deposit_amount,
            deposit_held_rupees: row.deposit_held_rupees,
            vehicle_security_deposit: vehicleDepositFromRow(row),
          })
    if (amount == null || amount <= 0) {
      return { ok: false, message: 'Enter a valid deposit amount greater than zero.' }
    }

    const ts = nowIso()
    const { error } = await admin
      .from('bookings')
      .update({
        deposit_amount: amount,
        deposit_held_rupees: amount,
        deposit_status: 'received',
        deposit_received_at: ts,
        updated_at: ts,
      })
      .eq('id', input.bookingId)

    if (error) return adminActionDbFailed('adminMarkDepositReceivedAction', error)

    await insertInspectionEvent(admin, {
      bookingId: input.bookingId,
      eventType: 'deposit_received',
      payload: { deposit_amount_rupees: amount },
      actorUserId: user.id,
    })

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.deposit_received',
      entityType: 'booking',
      entityId: input.bookingId,
      payload: { deposit_amount_rupees: amount },
    })

    await adminRecomputeBookingFinancialsAction(input.bookingId)
    revalidateFinancialPaths(input.bookingId)
    return { ok: true }
  })
}

export type AdminPenaltyFormInput = {
  bookingId: string
  penaltyLateRupees: number
  penaltyFuelRupees: number
  penaltyExtraKmRupees: number
  penaltyCleaningRupees: number
  penaltyDamageRupees: number
  penaltyTrafficRupees: number
  depositPenaltyTotalRupees?: number | null
  manualOverride?: boolean
  notes?: Partial<Record<PenaltyCategory, string | null>>
}

export async function adminApplyBookingPenaltiesFullAction(
  input: AdminPenaltyFormInput,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminApplyBookingPenaltiesFullAction', 'payments', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const amounts = {
      penaltyLateRupees: parsePenaltyAmount(input.penaltyLateRupees),
      penaltyFuelRupees: parsePenaltyAmount(input.penaltyFuelRupees),
      penaltyExtraKmRupees: parsePenaltyAmount(input.penaltyExtraKmRupees),
      penaltyCleaningRupees: parsePenaltyAmount(input.penaltyCleaningRupees),
      penaltyDamageRupees: parsePenaltyAmount(input.penaltyDamageRupees),
      penaltyTrafficRupees: parsePenaltyAmount(input.penaltyTrafficRupees),
    }
    for (const v of Object.values(amounts)) {
      if (v == null) return { ok: false, message: 'Invalid penalty amounts.' }
    }

    const resolvedAmounts = {
      penaltyLateRupees: amounts.penaltyLateRupees!,
      penaltyFuelRupees: amounts.penaltyFuelRupees!,
      penaltyExtraKmRupees: amounts.penaltyExtraKmRupees!,
      penaltyCleaningRupees: amounts.penaltyCleaningRupees!,
      penaltyDamageRupees: amounts.penaltyDamageRupees!,
      penaltyTrafficRupees: amounts.penaltyTrafficRupees!,
    }

    const row = await loadBookingFinancialRow(admin, input.bookingId)
    if (!row) return { ok: false, message: 'Booking not found.' }
    if (row.booking_status === 'cancelled') {
      return { ok: false, message: 'Penalties cannot be applied to a cancelled booking.' }
    }

    const depositAmount = resolveDepositAmount({
      deposit_amount: row.deposit_amount,
      deposit_held_rupees: row.deposit_held_rupees,
      vehicle_security_deposit: vehicleDepositFromRow(row),
    })
    const penaltyTotal = computePenaltyTotal(resolvedAmounts)
    const manualOverride = Boolean(input.manualOverride)
    let depositApplied = Math.min(depositAmount, penaltyTotal)
    if (manualOverride && input.depositPenaltyTotalRupees != null) {
      const manual = parsePenaltyAmount(input.depositPenaltyTotalRupees)
      if (manual == null) return { ok: false, message: 'Invalid deposit deduction amount.' }
      depositApplied = manual
    }

    const notesJson = penaltyNotesToJson(input.notes ?? penaltyNotesFromJson(row.penalty_notes))
    const snapshot = buildDeductionsSnapshot({
      amounts: resolvedAmounts,
      depositAmountRupees: depositAmount,
      depositAppliedRupees: depositApplied,
      manualOverride,
      notes: input.notes,
    })

    const ts = nowIso()
    const { error } = await admin
      .from('bookings')
      .update({
        penalty_late_rupees: resolvedAmounts.penaltyLateRupees,
        penalty_fuel_rupees: resolvedAmounts.penaltyFuelRupees,
        penalty_extra_km_rupees: resolvedAmounts.penaltyExtraKmRupees,
        penalty_cleaning_rupees: resolvedAmounts.penaltyCleaningRupees,
        penalty_damage_rupees: resolvedAmounts.penaltyDamageRupees,
        penalty_traffic_rupees: resolvedAmounts.penaltyTrafficRupees,
        penalty_total: penaltyTotal,
        deposit_penalty_total_rupees: depositApplied,
        refund_amount: snapshot.refundable_balance_rupees,
        deductions: snapshot as unknown as Json,
        penalty_notes: notesJson as Json,
        financial_manual_override: manualOverride,
        updated_at: ts,
      })
      .eq('id', input.bookingId)

    if (error) return adminActionDbFailed('adminApplyBookingPenaltiesFullAction', error)

    await insertInspectionEvent(admin, {
      bookingId: input.bookingId,
      eventType: 'penalty_updated',
      payload: {
        penalty_total_rupees: penaltyTotal,
        deposit_applied_rupees: depositApplied,
        manual_override: manualOverride,
      },
      actorUserId: user.id,
    })

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.penalties',
      entityType: 'booking',
      entityId: input.bookingId,
      payload: { penalty_total_rupees: penaltyTotal },
    })

    revalidateFinancialPaths(input.bookingId)
    return { ok: true }
  })
}

export async function adminProcessDepositRefundAction(input: {
  bookingId: string
  refundAmountRupees: number
  note?: string | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminProcessDepositRefundAction', 'payments', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const refund = parsePenaltyAmount(input.refundAmountRupees)
    if (refund == null) return { ok: false, message: 'Invalid refund amount.' }

    const row = await loadBookingFinancialRow(admin, input.bookingId)
    if (!row) return { ok: false, message: 'Booking not found.' }
    if (row.deposit_status !== 'received' && row.deposit_status !== 'partially_refunded') {
      return { ok: false, message: 'Deposit must be received before processing a refund.' }
    }

    const depositAmount = resolveDepositAmount({
      deposit_amount: row.deposit_amount,
      deposit_held_rupees: row.deposit_held_rupees,
      vehicle_security_deposit: vehicleDepositFromRow(row),
    })
    if (refund > depositAmount) {
      return { ok: false, message: 'Refund cannot exceed the deposit held.' }
    }

    const ts = nowIso()
    const nextStatus = refund >= depositAmount ? 'refunded' : 'partially_refunded'

    const { error } = await admin
      .from('bookings')
      .update({
        deposit_status: nextStatus,
        refund_amount: refund,
        deposit_refunded_rupees: refund,
        deposit_refunded_at: ts,
        refund_processed_at: ts,
        updated_at: ts,
      })
      .eq('id', input.bookingId)

    if (error) return adminActionDbFailed('adminProcessDepositRefundAction', error)

    const metadata: Json = {
      source: 'admin_console',
      kind: 'deposit_refund',
      refund_amount_rupees: refund,
      note: input.note?.trim() || null,
    }

    const { error: ledgerErr } = await admin.from('payment_events').insert({
      user_id: row.user_id,
      booking_id: input.bookingId,
      title: nextStatus === 'refunded' ? 'Security deposit refunded' : 'Security deposit partial refund',
      amount_rupees: refund,
      direction: 'deposit_release',
      status: 'posted',
      metadata,
    })
    if (ledgerErr) return adminActionDbFailed('adminProcessDepositRefundAction', ledgerErr)

    await insertInspectionEvent(admin, {
      bookingId: input.bookingId,
      eventType: 'deposit_refund_processed',
      payload: { refund_amount_rupees: refund, deposit_status: nextStatus },
      actorUserId: user.id,
    })

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.deposit_refund',
      entityType: 'booking',
      entityId: input.bookingId,
      payload: { refund_amount_rupees: refund },
    })

    revalidateFinancialPaths(input.bookingId)
    return { ok: true }
  })
}

export async function adminWithholdDepositAction(input: {
  bookingId: string
  note?: string | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminWithholdDepositAction', 'payments', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const row = await loadBookingFinancialRow(admin, input.bookingId)
    if (!row) return { ok: false, message: 'Booking not found.' }
    if (row.deposit_status === 'refunded') {
      return { ok: false, message: 'Deposit was already refunded.' }
    }

    const ts = nowIso()
    const depositAmount = resolveDepositAmount({
      deposit_amount: row.deposit_amount,
      deposit_held_rupees: row.deposit_held_rupees,
      vehicle_security_deposit: vehicleDepositFromRow(row),
    })

    const { error } = await admin
      .from('bookings')
      .update({
        deposit_status: 'withheld',
        refund_amount: 0,
        deposit_refunded_rupees: 0,
        refund_processed_at: ts,
        updated_at: ts,
      })
      .eq('id', input.bookingId)

    if (error) return adminActionDbFailed('adminWithholdDepositAction', error)

    await insertInspectionEvent(admin, {
      bookingId: input.bookingId,
      eventType: 'deposit_withheld',
      payload: { deposit_amount_rupees: depositAmount, note: input.note?.trim() || null },
      actorUserId: user.id,
    })

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.deposit_withheld',
      entityType: 'booking',
      entityId: input.bookingId,
    })

    revalidateFinancialPaths(input.bookingId)
    return { ok: true }
  })
}

/** Called after return inspection — auto-sync financial summary from penalty lines. */
export async function adminSyncFinancialsAfterReturnAction(bookingId: string): Promise<AdminActionResult> {
  return adminRecomputeBookingFinancialsAction(bookingId)
}
