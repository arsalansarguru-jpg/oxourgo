'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { requireAppRole } from '@/lib/auth/server'
import { hasVehicleBookingOverlap } from '@/lib/booking/vehicle-overlap'
import { validatePickupInspectionForHandover, validateReturnInspectionForCheckpoint } from '@/lib/admin/booking-inspection-validate'
import {
  onBookingApproved,
  onBookingCancelled,
  onBookingRejected,
  onPaymentStatusChanged,
  onTripCompleted,
  onTripStarted,
} from '@/lib/notifications/events'
import type { Database, Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminActionDbFailed } from '@/lib/errors/safe-user-message'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'
import {
  adminMarkBookingPaymentReceivedAction,
  adminMarkBookingPaymentRefundedAction,
} from '@/lib/admin/actions/payment-actions'

const PAYMENT_STATUSES = ['pending', 'received', 'partial', 'refunded'] as const
const BOOKING_STATUSES = ['pending_payment', 'confirmed', 'active', 'completed', 'cancelled'] as const

function nowIso() {
  return new Date().toISOString()
}

/** Approve pending request: overlap re-check, confirmed + audit + timestamps + notification. */
async function confirmPendingBookingFromAdmin(bookingId: string, actorUserId: string): Promise<AdminActionResult> {
  const admin = createAdminClient()

  const { data: row, error: fetchErr } = await admin
    .from('bookings')
    .select('booking_status, vehicle_id, pickup_date, return_date')
    .eq('id', bookingId)
    .single()

  if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
  if (row.booking_status !== 'pending_payment') {
    return { ok: false, message: 'Only pending requests can be approved.' }
  }
  if (!row.vehicle_id) {
    return { ok: false, message: 'Booking is missing a vehicle allocation.' }
  }

  const { overlap, error: ovErr } = await hasVehicleBookingOverlap(
    row.vehicle_id,
    row.pickup_date,
    row.return_date,
    bookingId,
    admin,
  )
  if (ovErr === 'overlap_rpc_missing') {
    return { ok: false, message: 'Availability checks are temporarily unavailable. Try again shortly.' }
  }
  if (ovErr) {
    return { ok: false, message: 'Could not verify availability. Please try again.' }
  }
  if (overlap) {
    return {
      ok: false,
      message: 'Another booking now occupies these dates. Refresh the page and adjust fleet or dates.',
    }
  }

  const ts = nowIso()
  const { error } = await admin
    .from('bookings')
    .update({
      booking_status: 'confirmed',
      approved_at: ts,
      approved_by: actorUserId,
      updated_at: ts,
    })
    .eq('id', bookingId)

  if (error) return adminActionDbFailed('confirmPendingBookingFromAdmin', error)

  await writeAdminAudit({
    actorUserId,
    action: 'booking.approve',
    entityType: 'booking',
    entityId: bookingId,
  })

  void onBookingApproved(bookingId)

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/bookings')
  return { ok: true }
}

export async function adminApproveBookingAction(bookingId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminApproveBookingAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    return confirmPendingBookingFromAdmin(bookingId, user.id)
  })
}

/**
 * Idempotent: pending → approve path. Already confirmed → success no-op.
 */
export async function adminMarkBookingActiveAction(bookingId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminMarkBookingActiveAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin.from('bookings').select('booking_status').eq('id', bookingId).single()
    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
    if (row.booking_status === 'confirmed' || row.booking_status === 'active') return { ok: true }
    if (row.booking_status === 'cancelled' || row.booking_status === 'completed') {
      return { ok: false, message: 'Booking cannot be marked active in this state.' }
    }
    if (row.booking_status !== 'pending_payment') {
      return { ok: false, message: 'Only pending bookings can be approved.' }
    }

    return confirmPendingBookingFromAdmin(bookingId, user.id)
  })
}

export async function adminRejectBookingAction(bookingId: string, note?: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminRejectBookingAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin.from('bookings').select('booking_status').eq('id', bookingId).single()
    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
    if (row.booking_status !== 'pending_payment') {
      return { ok: false, message: 'Only pending requests can be rejected.' }
    }

    const { error } = await admin
      .from('bookings')
      .update({
        booking_status: 'cancelled',
        ops_note: note?.trim() || null,
        updated_at: nowIso(),
      })
      .eq('id', bookingId)

    if (error) return adminActionDbFailed('adminRejectBookingAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.reject',
      entityType: 'booking',
      entityId: bookingId,
      payload: { note: note?.trim() ?? null },
    })

    void onBookingRejected(bookingId, note)

    revalidatePath('/admin/bookings')
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    return { ok: true }
  })
}

export async function adminCancelBookingAction(bookingId: string, note?: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminCancelBookingAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin.from('bookings').select('booking_status').eq('id', bookingId).single()
    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
    if (row.booking_status === 'cancelled' || row.booking_status === 'completed') {
      return { ok: false, message: 'Booking cannot be cancelled in its current state.' }
    }

    const { error } = await admin
      .from('bookings')
      .update({
        booking_status: 'cancelled',
        ops_note: note?.trim() || null,
        updated_at: nowIso(),
      })
      .eq('id', bookingId)

    if (error) return adminActionDbFailed('adminCancelBookingAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.cancel',
      entityType: 'booking',
      entityId: bookingId,
      payload: { note: note?.trim() ?? null },
    })

    void onBookingCancelled(bookingId, note)

    revalidatePath('/admin/bookings')
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    return { ok: true }
  })
}

export async function adminMarkHandedOverAction(bookingId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminMarkHandedOverAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin.from('bookings').select('booking_status').eq('id', bookingId).single()
    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
    if (row.booking_status !== 'confirmed') {
      return { ok: false, message: 'Handover is only available once the booking is approved (confirmed).' }
    }

    const inspection = await validatePickupInspectionForHandover(admin, bookingId)
    if (!inspection.ok) return inspection

    const ts = nowIso()
    const { error } = await admin
      .from('bookings')
      .update({
        booking_status: 'active',
        handed_over_at: ts,
        handed_over_by: user.id,
        updated_at: ts,
      })
      .eq('id', bookingId)

    if (error) return adminActionDbFailed('adminMarkHandedOverAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.handed_over',
      entityType: 'booking',
      entityId: bookingId,
    })

    void onTripStarted(bookingId)

    revalidatePath('/admin/bookings')
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    return { ok: true }
  })
}

export async function adminMarkReturnedAction(bookingId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminMarkReturnedAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin
      .from('bookings')
      .select('booking_status, returned_at')
      .eq('id', bookingId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
    if (row.booking_status !== 'active') {
      return { ok: false, message: 'Return checkpoint applies to active trips only.' }
    }
    if (row.returned_at) {
      return { ok: true }
    }

    const inspection = await validateReturnInspectionForCheckpoint(admin, bookingId)
    if (!inspection.ok) return inspection

    const ts = nowIso()
    const { error } = await admin.from('bookings').update({ returned_at: ts, updated_at: ts }).eq('id', bookingId)

    if (error) return adminActionDbFailed('adminMarkReturnedAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.returned',
      entityType: 'booking',
      entityId: bookingId,
    })

    revalidatePath('/admin/bookings')
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    return { ok: true }
  })
}

export async function adminMarkCompletedAction(bookingId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminMarkCompletedAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin.from('bookings').select('booking_status').eq('id', bookingId).single()
    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
    if (row.booking_status !== 'active') {
      return { ok: false, message: 'Complete is only available for an active trip (after handover).' }
    }

    const ts = nowIso()
    const { error } = await admin
      .from('bookings')
      .update({
        booking_status: 'completed',
        completed_at: ts,
        completed_by: user.id,
        updated_at: ts,
      })
      .eq('id', bookingId)

    if (error) return adminActionDbFailed('adminMarkCompletedAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.completed',
      entityType: 'booking',
      entityId: bookingId,
    })

    void onTripCompleted(bookingId)

    revalidatePath('/admin/bookings')
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    return { ok: true }
  })
}

export async function adminSetBookingPaymentStatusAction(
  bookingId: string,
  payment_status: string,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSetBookingPaymentStatusAction', 'payments', async () => {
    const { user } = await requireAppRole('ops_admin')
    if (!(PAYMENT_STATUSES as readonly string[]).includes(payment_status)) {
      return { ok: false, message: 'Invalid payment status.' }
    }

    if (payment_status === 'received') {
      return adminMarkBookingPaymentReceivedAction(bookingId)
    }
    if (payment_status === 'refunded') {
      return adminMarkBookingPaymentRefundedAction(bookingId)
    }
    if (payment_status === 'partial') {
      return {
        ok: false,
        message: 'Partial payments require an amount — use Mark partial payment on the booking.',
      }
    }

    const admin = createAdminClient()
    const { data: prevRow, error: prevErr } = await admin
      .from('bookings')
      .select('payment_status, total_rupees')
      .eq('id', bookingId)
      .maybeSingle()

    if (prevErr || !prevRow) return { ok: false, message: 'Booking not found.' }

    const previous = prevRow.payment_status ?? null
    const total = Math.max(0, Math.round(Number(prevRow.total_rupees ?? 0)))
    const ts = nowIso()

    const patch: Database['public']['Tables']['bookings']['Update'] = {
      payment_status: 'pending',
      amount_paid: 0,
      amount_due: total,
      payment_received_at: null,
      payment_received_by: null,
      updated_at: ts,
    }

    const { error } = await admin.from('bookings').update(patch).eq('id', bookingId)
    if (error) return adminActionDbFailed('adminSetBookingPaymentStatusAction', error)

    if (previous !== 'pending') {
      void onPaymentStatusChanged(bookingId, 'pending', previous)
    }

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.payment_status',
      entityType: 'booking',
      entityId: bookingId,
      payload: { payment_status: 'pending' },
    })

    revalidatePath('/admin/bookings')
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath('/admin/payments')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    return { ok: true }
  })
}

export async function adminSetBookingStatusAction(
  bookingId: string,
  booking_status: string,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSetBookingStatusAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    if (!(BOOKING_STATUSES as readonly string[]).includes(booking_status)) {
      return { ok: false, message: 'Invalid booking status.' }
    }

    const admin = createAdminClient()
    const patch: Database['public']['Tables']['bookings']['Update'] = {
      booking_status,
      updated_at: nowIso(),
    }
    const { error } = await admin.from('bookings').update(patch).eq('id', bookingId)

    if (error) return adminActionDbFailed('adminSetBookingStatusAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.status',
      entityType: 'booking',
      entityId: bookingId,
      payload: { booking_status },
    })

    revalidatePath('/admin/bookings')
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    return { ok: true }
  })
}

export async function adminSetBookingInternalNotesAction(bookingId: string, notes: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSetBookingInternalNotesAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const { error } = await admin
      .from('bookings')
      .update({
        admin_internal_notes: notes.trim() || null,
        updated_at: nowIso(),
      })
      .eq('id', bookingId)

    if (error) return adminActionDbFailed('adminSetBookingInternalNotesAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.internal_notes',
      entityType: 'booking',
      entityId: bookingId,
    })

    revalidatePath(`/admin/bookings/${bookingId}`)
    return { ok: true }
  })
}

function asChecklistRecord(j: Json | null | undefined): Record<string, boolean> {
  if (!j || typeof j !== 'object' || Array.isArray(j)) return {}
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(j as Record<string, Json>)) {
    out[k] = Boolean(v)
  }
  return out
}

export async function adminSaveBookingChecklistsAction(input: {
  bookingId: string
  pickup?: Record<string, boolean> | null
  return?: Record<string, boolean> | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSaveBookingChecklistsAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const { data: row, error: fetchErr } = await admin
      .from('bookings')
      .select('pickup_checklist, return_checklist')
      .eq('id', input.bookingId)
      .single()

    if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }

    const pickup = input.pickup != null ? { ...asChecklistRecord(row.pickup_checklist), ...input.pickup } : undefined
    const ret =
      input.return != null ? { ...asChecklistRecord(row.return_checklist), ...input.return } : undefined

    const patch: Database['public']['Tables']['bookings']['Update'] = { updated_at: nowIso() }
    if (pickup) patch.pickup_checklist = pickup as Json
    if (ret) patch.return_checklist = ret as Json

    if (!pickup && !ret) {
      return { ok: false, message: 'Nothing to save.' }
    }

    const { error } = await admin.from('bookings').update(patch).eq('id', input.bookingId)
    if (error) return adminActionDbFailed('adminSaveBookingChecklistsAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.checklists',
      entityType: 'booking',
      entityId: input.bookingId,
    })

    revalidatePath(`/admin/bookings/${input.bookingId}`)
    return { ok: true }
  })
}

export async function adminSetBookingDepositTrackingAction(input: {
  bookingId: string
  depositHeldRupees?: number | null
  depositRefundedAt?: string | null
  depositRefundedRupees?: number | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSetBookingDepositTrackingAction', 'payments', async () => {
    const { user } = await requireAppRole('ops_admin')
    const admin = createAdminClient()

    const patch: Database['public']['Tables']['bookings']['Update'] = { updated_at: nowIso() }
    if (input.depositHeldRupees !== undefined) {
      const v = input.depositHeldRupees
      patch.deposit_held_rupees =
        v == null || (typeof v === 'number' && Number.isNaN(v)) ? null : Math.round(Number(v))
    }
    if (input.depositRefundedAt !== undefined) patch.deposit_refunded_at = input.depositRefundedAt
    if (input.depositRefundedRupees !== undefined) {
      const v = input.depositRefundedRupees
      patch.deposit_refunded_rupees =
        v == null || (typeof v === 'number' && Number.isNaN(v)) ? null : Math.round(Number(v))
    }

    const { error } = await admin.from('bookings').update(patch).eq('id', input.bookingId)
    if (error) return adminActionDbFailed('adminSetBookingDepositTrackingAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'booking.deposit_tracking',
      entityType: 'booking',
      entityId: input.bookingId,
      payload: {
        depositHeldRupees: input.depositHeldRupees ?? undefined,
        depositRefundedAt: input.depositRefundedAt ?? undefined,
        depositRefundedRupees: input.depositRefundedRupees ?? undefined,
      },
    })

    revalidatePath(`/admin/bookings/${input.bookingId}`)
    return { ok: true }
  })
}
