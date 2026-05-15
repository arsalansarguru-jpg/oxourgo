'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { requirePermissionForAdminAction } from '@/lib/auth/admin-action-auth'
import {
  VIOLATION_TYPES,
  sumViolationAmounts,
  type ViolationStatus,
  type ViolationType,
} from '@/lib/booking/violations'
import { adminActionDbFailed, logUnknownError, SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'
import type { Database, Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

const CHALLAN_BUCKET = 'booking_violation_challans'
const MAX_CHALLAN_BYTES = 8 * 1024 * 1024
const ALLOWED_CHALLAN_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'] as const

function nowIso() {
  return new Date().toISOString()
}

function parseAmount(n: unknown): number | null {
  const v = Math.round(Number(n))
  if (!Number.isFinite(v) || v <= 0 || v > 100_000_000) return null
  return v
}

function parseViolationType(raw: string): ViolationType | null {
  const t = raw.trim().toLowerCase()
  return (VIOLATION_TYPES as readonly string[]).includes(t) ? (t as ViolationType) : null
}

function parseDateYmd(raw: string): string | null {
  const d = raw.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null
  const ts = Date.parse(`${d}T00:00:00.000Z`)
  if (!Number.isFinite(ts)) return null
  return d
}

export async function insertViolationEvent(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    violationId: string
    bookingId: string
    eventType: string
    payload?: Json
    actorUserId: string
  },
) {
  const { error } = await admin.from('booking_violation_events').insert({
    violation_id: input.violationId,
    booking_id: input.bookingId,
    event_type: input.eventType,
    payload: input.payload ?? {},
    actor_user_id: input.actorUserId,
  })
  if (error) logUnknownError('insertViolationEvent', error)
}

async function loadViolationsForBooking(admin: ReturnType<typeof createAdminClient>, bookingId: string) {
  const { data, error } = await admin
    .from('booking_violations')
    .select('id, amount_rupees, status')
    .eq('booking_id', bookingId)

  if (error) {
    logUnknownError('loadViolationsForBooking', error)
    return []
  }
  return data ?? []
}

/** Sync penalty_traffic_rupees + outstanding_fines_rupees from violation rows; recompute deposit snapshot. */
export async function syncBookingViolationsToFinancials(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string,
): Promise<void> {
  const violations = await loadViolationsForBooking(admin, bookingId)
  const { totalLiabilityRupees, outstandingRupees } = sumViolationAmounts(
    violations as Array<{ amount_rupees: number; status: string }>,
  )

  const { data: booking, error: bErr } = await admin
    .from('bookings')
    .select(
      'penalty_late_rupees, penalty_fuel_rupees, penalty_extra_km_rupees, penalty_cleaning_rupees, penalty_damage_rupees, penalty_traffic_rupees, deposit_penalty_total_rupees, financial_manual_override',
    )
    .eq('id', bookingId)
    .single()

  if (bErr || !booking) return

  const ts = nowIso()

  const { error: upErr } = await admin
    .from('bookings')
    .update({
      penalty_traffic_rupees: totalLiabilityRupees,
      outstanding_fines_rupees: outstandingRupees,
      updated_at: ts,
    })
    .eq('id', bookingId)

  if (upErr) {
    logUnknownError('syncBookingViolationsToFinancials', upErr)
    return
  }

  const { adminRecomputeBookingFinancialsAction } = await import('@/lib/admin/actions/deposit-financial-actions')
  await adminRecomputeBookingFinancialsAction(bookingId, {
    manualDepositAppliedRupees: booking.financial_manual_override ? booking.deposit_penalty_total_rupees : null,
    manualOverride: booking.financial_manual_override,
  })
}

function revalidateViolationPaths(bookingId: string) {
  revalidatePath('/admin/violations')
  revalidatePath('/admin/financials')
  revalidatePath('/admin/analytics')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/bookings')
  revalidatePath('/dashboard/bookings')
  revalidatePath(`/dashboard/bookings/${bookingId}`)
}

export async function adminCreateViolationAction(input: {
  bookingId: string
  violationType: string
  amountRupees: number
  reason: string
  violationDate: string
  authoritySource?: string | null
  notes?: string | null
  notifyCustomer?: boolean
}): Promise<AdminActionResult & { violationId?: string }> {
  return runInstrumentedServerAction('adminCreateViolationAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('penalties.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()

    const violationType = parseViolationType(input.violationType)
    const amount = parseAmount(input.amountRupees)
    const violationDate = parseDateYmd(input.violationDate)
    const reason = input.reason.trim()

    if (!violationType) return { ok: false, message: 'Select a valid violation type.' }
    if (amount == null) return { ok: false, message: 'Enter a valid amount greater than zero.' }
    if (!violationDate) return { ok: false, message: 'Violation date must be YYYY-MM-DD.' }
    if (reason.length < 3) return { ok: false, message: 'Reason must be at least 3 characters.' }

    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select('id, user_id, booking_status')
      .eq('id', input.bookingId)
      .single()

    if (bErr || !booking) return { ok: false, message: 'Booking not found.' }
    if (booking.booking_status === 'cancelled') {
      return { ok: false, message: 'Violations cannot be added to a cancelled booking.' }
    }

    const ts = nowIso()
    const status: ViolationStatus = input.notifyCustomer ? 'customer_notified' : 'pending'

    const insert: Database['public']['Tables']['booking_violations']['Insert'] = {
      booking_id: input.bookingId,
      user_id: booking.user_id,
      violation_type: violationType,
      amount_rupees: amount,
      reason,
      violation_date: violationDate,
      authority_source: input.authoritySource?.trim() || null,
      notes: input.notes?.trim() || null,
      status,
      created_by: user.id,
      created_at: ts,
      updated_at: ts,
      ...(input.notifyCustomer ? { customer_notified_at: ts } : {}),
    }

    const { data: row, error } = await admin.from('booking_violations').insert(insert).select('id').single()
    if (error) return adminActionDbFailed('adminCreateViolationAction', error)
    if (!row?.id) return { ok: false, message: SAFE_USER_MESSAGE.generic }

    await insertViolationEvent(admin, {
      violationId: row.id,
      bookingId: input.bookingId,
      eventType: 'violation_created',
      payload: { violation_type: violationType, amount_rupees: amount, status },
      actorUserId: user.id,
    })

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'violation.create',
      entityType: 'booking_violation',
      entityId: row.id,
      payload: { booking_id: input.bookingId, amount_rupees: amount },
    })

    await syncBookingViolationsToFinancials(admin, input.bookingId)
    revalidateViolationPaths(input.bookingId)
    return { ok: true, violationId: row.id }
  })
}

export async function adminUpdateViolationAction(input: {
  violationId: string
  violationType?: string
  amountRupees?: number
  reason?: string
  violationDate?: string
  authoritySource?: string | null
  notes?: string | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminUpdateViolationAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('penalties.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()

    const { data: existing, error: fetchErr } = await admin
      .from('booking_violations')
      .select('id, booking_id, status, amount_rupees')
      .eq('id', input.violationId)
      .single()

    if (fetchErr || !existing) return { ok: false, message: 'Violation not found.' }
    if (existing.status === 'paid' || existing.status === 'deducted_from_deposit') {
      return { ok: false, message: 'Settled violations cannot be edited. Mark disputed instead if needed.' }
    }

    const patch: Database['public']['Tables']['booking_violations']['Update'] = {
      updated_at: nowIso(),
    }

    if (input.violationType != null) {
      const t = parseViolationType(input.violationType)
      if (!t) return { ok: false, message: 'Invalid violation type.' }
      patch.violation_type = t
    }
    if (input.amountRupees != null) {
      const amt = parseAmount(input.amountRupees)
      if (amt == null) return { ok: false, message: 'Invalid amount.' }
      patch.amount_rupees = amt
    }
    if (input.reason != null) {
      const reason = input.reason.trim()
      if (reason.length < 3) return { ok: false, message: 'Reason must be at least 3 characters.' }
      patch.reason = reason
    }
    if (input.violationDate != null) {
      const d = parseDateYmd(input.violationDate)
      if (!d) return { ok: false, message: 'Violation date must be YYYY-MM-DD.' }
      patch.violation_date = d
    }
    if (input.authoritySource !== undefined) patch.authority_source = input.authoritySource?.trim() || null
    if (input.notes !== undefined) patch.notes = input.notes?.trim() || null

    const { error } = await admin.from('booking_violations').update(patch).eq('id', input.violationId)
    if (error) return adminActionDbFailed('adminUpdateViolationAction', error)

    await insertViolationEvent(admin, {
      violationId: input.violationId,
      bookingId: existing.booking_id,
      eventType: 'violation_updated',
      payload: patch as Json,
      actorUserId: user.id,
    })

    await syncBookingViolationsToFinancials(admin, existing.booking_id)
    revalidateViolationPaths(existing.booking_id)
    return { ok: true }
  })
}

export async function adminUploadViolationChallanAction(formData: FormData): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminUploadViolationChallanAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('penalties.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const violationId = String(formData.get('violationId') ?? '').trim()
    const file = formData.get('file')

    if (!violationId || !(file instanceof File) || file.size === 0) {
      return { ok: false, message: 'Violation and challan file are required.' }
    }
    if (file.size > MAX_CHALLAN_BYTES) {
      return { ok: false, message: 'Challan file must be 8MB or smaller.' }
    }

    const admin = createAdminClient()
    const { data: violation, error: vErr } = await admin
      .from('booking_violations')
      .select('id, booking_id, challan_storage_path')
      .eq('id', violationId)
      .single()

    if (vErr || !violation) return { ok: false, message: 'Violation not found.' }

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
    const safeExt = (ALLOWED_CHALLAN_EXT as readonly string[]).includes(ext) ? ext : 'jpg'
    const path = `bookings/${violation.booking_id}/violations/${violationId}/challan-${Date.now()}.${safeExt}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: upErr } = await admin.storage.from(CHALLAN_BUCKET).upload(path, buffer, {
      contentType: file.type || (safeExt === 'pdf' ? 'application/pdf' : 'image/jpeg'),
      upsert: false,
    })
    if (upErr) {
      logUnknownError('adminUploadViolationChallanAction:storage', upErr)
      return { ok: false, message: SAFE_USER_MESSAGE.generic }
    }

    const ts = nowIso()
    const { error: dbErr } = await admin
      .from('booking_violations')
      .update({
        challan_storage_path: path,
        challan_mime: file.type || null,
        challan_file_name: file.name,
        updated_at: ts,
      })
      .eq('id', violationId)

    if (dbErr) {
      await admin.storage.from(CHALLAN_BUCKET).remove([path]).catch(() => {})
      return adminActionDbFailed('adminUploadViolationChallanAction:db', dbErr)
    }

    if (violation.challan_storage_path && violation.challan_storage_path !== path) {
      await admin.storage.from(CHALLAN_BUCKET).remove([violation.challan_storage_path]).catch(() => {})
    }

    await insertViolationEvent(admin, {
      violationId,
      bookingId: violation.booking_id,
      eventType: 'challan_uploaded',
      payload: { path, file_name: file.name },
      actorUserId: user.id,
    })

    revalidateViolationPaths(violation.booking_id)
    return { ok: true }
  })
}

export async function adminNotifyViolationCustomerAction(violationId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminNotifyViolationCustomerAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('penalties.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()
    const ts = nowIso()

    const { data: row, error: fetchErr } = await admin
      .from('booking_violations')
      .select('id, booking_id, status')
      .eq('id', violationId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Violation not found.' }
    if (row.status === 'paid' || row.status === 'deducted_from_deposit') {
      return { ok: false, message: 'Violation is already settled.' }
    }

    const { error } = await admin
      .from('booking_violations')
      .update({
        status: 'customer_notified',
        customer_notified_at: ts,
        updated_at: ts,
      })
      .eq('id', violationId)

    if (error) return adminActionDbFailed('adminNotifyViolationCustomerAction', error)

    await insertViolationEvent(admin, {
      violationId,
      bookingId: row.booking_id,
      eventType: 'customer_notified',
      payload: {},
      actorUserId: user.id,
    })

    await syncBookingViolationsToFinancials(admin, row.booking_id)
    revalidateViolationPaths(row.booking_id)
    return { ok: true }
  })
}

export async function adminDeductViolationFromDepositAction(violationId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminDeductViolationFromDepositAction', 'payments', async () => {
    const guard = await requirePermissionForAdminAction('penalties.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()
    const ts = nowIso()

    const { data: row, error: fetchErr } = await admin
      .from('booking_violations')
      .select('id, booking_id, status, amount_rupees')
      .eq('id', violationId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Violation not found.' }
    if (row.status === 'paid' || row.status === 'deducted_from_deposit') {
      return { ok: false, message: 'Violation is already settled.' }
    }

    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select('deposit_status, booking_status')
      .eq('id', row.booking_id)
      .single()

    if (bErr || !booking) return { ok: false, message: 'Booking not found.' }
    if (booking.booking_status === 'cancelled') {
      return { ok: false, message: 'Cannot deduct deposit on a cancelled booking.' }
    }
    if (booking.deposit_status !== 'received' && booking.deposit_status !== 'partially_refunded') {
      return { ok: false, message: 'Security deposit must be received before deducting fines.' }
    }

    const amount = Math.round(row.amount_rupees)

    const { error } = await admin
      .from('booking_violations')
      .update({
        status: 'deducted_from_deposit',
        amount_deducted_rupees: amount,
        deducted_at: ts,
        resolved_at: ts,
        updated_at: ts,
      })
      .eq('id', violationId)

    if (error) return adminActionDbFailed('adminDeductViolationFromDepositAction', error)

    await insertViolationEvent(admin, {
      violationId,
      bookingId: row.booking_id,
      eventType: 'deducted_from_deposit',
      payload: { amount_rupees: amount },
      actorUserId: user.id,
    })

    await syncBookingViolationsToFinancials(admin, row.booking_id)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'violation.deposit_deduct',
      entityType: 'booking_violation',
      entityId: violationId,
      payload: { booking_id: row.booking_id, amount_rupees: amount },
    })

    revalidateViolationPaths(row.booking_id)
    return { ok: true }
  })
}

export async function adminRecordViolationManualPaymentAction(input: {
  violationId: string
  note?: string | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminRecordViolationManualPaymentAction', 'payments', async () => {
    const guard = await requirePermissionForAdminAction('penalties.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()
    const ts = nowIso()

    const { data: row, error: fetchErr } = await admin
      .from('booking_violations')
      .select('id, booking_id, user_id, status, amount_rupees, reason')
      .eq('id', input.violationId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Violation not found.' }
    if (row.status === 'paid' || row.status === 'deducted_from_deposit') {
      return { ok: false, message: 'Violation is already settled.' }
    }

    const amount = Math.round(row.amount_rupees)

    const { error } = await admin
      .from('booking_violations')
      .update({
        status: 'paid',
        amount_paid_rupees: amount,
        paid_at: ts,
        resolved_at: ts,
        updated_at: ts,
      })
      .eq('id', input.violationId)

    if (error) return adminActionDbFailed('adminRecordViolationManualPaymentAction', error)

    const metadata: Json = {
      source: 'admin_console',
      kind: 'violation_manual_payment',
      violation_id: input.violationId,
      note: input.note?.trim() || null,
    }

    const { error: ledgerErr } = await admin.from('payment_events').insert({
      user_id: row.user_id,
      booking_id: row.booking_id,
      title: `Fine payment — ${row.reason.slice(0, 60)}`,
      amount_rupees: amount,
      direction: 'rental_collection',
      status: 'posted',
      metadata,
    })
    if (ledgerErr) return adminActionDbFailed('adminRecordViolationManualPaymentAction', ledgerErr)

    await insertViolationEvent(admin, {
      violationId: input.violationId,
      bookingId: row.booking_id,
      eventType: 'manual_payment_received',
      payload: { amount_rupees: amount },
      actorUserId: user.id,
    })

    await syncBookingViolationsToFinancials(admin, row.booking_id)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'violation.manual_payment',
      entityType: 'booking_violation',
      entityId: input.violationId,
      payload: { amount_rupees: amount },
    })

    revalidateViolationPaths(row.booking_id)
    return { ok: true }
  })
}

export async function adminMarkViolationDisputedAction(input: {
  violationId: string
  note?: string | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminMarkViolationDisputedAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('penalties.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()
    const ts = nowIso()

    const { data: row, error: fetchErr } = await admin
      .from('booking_violations')
      .select('id, booking_id, status')
      .eq('id', input.violationId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Violation not found.' }
    if (row.status === 'paid' || row.status === 'deducted_from_deposit') {
      return { ok: false, message: 'Settled violations cannot be disputed.' }
    }

    const { error } = await admin
      .from('booking_violations')
      .update({
        status: 'disputed',
        notes: input.note?.trim() ? input.note.trim() : undefined,
        updated_at: ts,
      })
      .eq('id', input.violationId)

    if (error) return adminActionDbFailed('adminMarkViolationDisputedAction', error)

    await insertViolationEvent(admin, {
      violationId: input.violationId,
      bookingId: row.booking_id,
      eventType: 'disputed',
      payload: { note: input.note?.trim() || null },
      actorUserId: user.id,
    })

    await syncBookingViolationsToFinancials(admin, row.booking_id)
    revalidateViolationPaths(row.booking_id)
    return { ok: true }
  })
}

export async function adminResolveViolationAction(input: {
  violationId: string
  resolution: 'waived' | 'paid' | 'deducted_from_deposit'
  note?: string | null
}): Promise<AdminActionResult> {
  if (input.resolution === 'paid') {
    return adminRecordViolationManualPaymentAction({ violationId: input.violationId, note: input.note })
  }
  if (input.resolution === 'deducted_from_deposit') {
    return adminDeductViolationFromDepositAction(input.violationId)
  }

  return runInstrumentedServerAction('adminResolveViolationAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('penalties.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()
    const ts = nowIso()

    const { data: row, error: fetchErr } = await admin
      .from('booking_violations')
      .select('id, booking_id, status, amount_rupees')
      .eq('id', input.violationId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Violation not found.' }

    const { error } = await admin
      .from('booking_violations')
      .update({
        status: 'paid',
        amount_paid_rupees: 0,
        resolved_at: ts,
        updated_at: ts,
        notes: input.note?.trim() || undefined,
      })
      .eq('id', input.violationId)

    if (error) return adminActionDbFailed('adminResolveViolationAction', error)

    await insertViolationEvent(admin, {
      violationId: input.violationId,
      bookingId: row.booking_id,
      eventType: 'waived',
      payload: { note: input.note?.trim() || null },
      actorUserId: user.id,
    })

    await syncBookingViolationsToFinancials(admin, row.booking_id)
    revalidateViolationPaths(row.booking_id)
    return { ok: true }
  })
}

export async function adminDeleteViolationAction(violationId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminDeleteViolationAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('penalties.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin
      .from('booking_violations')
      .select('id, booking_id, status, challan_storage_path')
      .eq('id', violationId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Violation not found.' }
    if (row.status === 'paid' || row.status === 'deducted_from_deposit') {
      return { ok: false, message: 'Settled violations cannot be deleted.' }
    }

    const { softDeleteRecord } = await import('@/lib/admin/soft-delete')
    const archived = await softDeleteRecord({
      table: 'booking_violations',
      id: violationId,
      actorUserId: user.id,
      snapshot: row as Record<string, unknown>,
      entityType: 'violation',
    })
    if (!archived.ok) return archived

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'violation.archived',
      entityType: 'booking_violation',
      entityId: violationId,
      payload: { booking_id: row.booking_id },
    })

    await syncBookingViolationsToFinancials(admin, row.booking_id)
    revalidateViolationPaths(row.booking_id)
    revalidatePath('/admin/backup')
    return { ok: true }
  })
}
