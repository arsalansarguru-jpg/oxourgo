'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { requirePermissionForAdminAction } from '@/lib/auth/admin-action-auth'
import { onOpsPaymentLedger, onPaymentStatusChanged } from '@/lib/notifications/events'
import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminActionDbFailed } from '@/lib/errors/safe-user-message'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'

export async function adminCreateRefundPlaceholderAction(bookingId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminCreateRefundPlaceholderAction', 'payments', async () => {
    const guard = await requirePermissionForAdminAction('payments.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()

    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select('user_id, total_rupees, payment_status')
      .eq('id', bookingId)
      .single()

    if (bErr || !booking) return { ok: false, message: 'Booking not found.' }

    const metadata: Json = {
      source: 'admin_console',
      kind: 'refund_placeholder',
      prior_payment_status: booking.payment_status,
    }

    const { error } = await admin.from('payment_events').insert({
      user_id: booking.user_id,
      booking_id: bookingId,
      title: 'Refund (placeholder — reconcile manually)',
      amount_rupees: booking.total_rupees,
      direction: 'credit',
      status: 'pending',
      metadata,
    })

    if (error) return adminActionDbFailed('adminCreateRefundPlaceholderAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'payment.refund_placeholder',
      entityType: 'booking',
      entityId: bookingId,
    })

    void onOpsPaymentLedger(bookingId, 'Refund placeholder recorded')

    revalidatePath('/admin/payments')
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath('/dashboard/payments')
    return { ok: true }
  })
}

function appendStaffPaymentNote(existing: string | null | undefined, line: string): string {
  const ts = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const base = existing?.trim()
  return base ? `${base}\n[${ts}] ${line}` : `[${ts}] ${line}`
}

async function insertOpsRentalLedgerLine(input: {
  admin: ReturnType<typeof createAdminClient>
  userId: string
  bookingId: string
  title: string
  amountRupees: number
  metadata: Json
}) {
  const { error } = await input.admin.from('payment_events').insert({
    user_id: input.userId,
    booking_id: input.bookingId,
    title: input.title,
    amount_rupees: Math.max(0, Math.round(input.amountRupees)),
    direction: 'rental_collection',
    status: 'posted',
    metadata: input.metadata,
  })
  if (error) return adminActionDbFailed('insertOpsRentalLedgerLine', error)
  return { ok: true as const }
}

export async function adminMarkBookingPaymentReceivedAction(
  bookingId: string,
  note?: string | null,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminMarkBookingPaymentReceivedAction', 'payments', async () => {
    const guard = await requirePermissionForAdminAction('payments.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()
    const ts = new Date().toISOString()

    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select('user_id, total_rupees, payment_status, payment_notes')
      .eq('id', bookingId)
      .single()

    if (bErr || !booking) return { ok: false, message: 'Booking not found.' }

    const total = Math.max(0, Math.round(Number(booking.total_rupees ?? 0)))
    const previous = booking.payment_status ?? null
    const nextNotes = note?.trim()
      ? appendStaffPaymentNote(booking.payment_notes, note.trim())
      : booking.payment_notes

    const { error: uErr } = await admin
      .from('bookings')
      .update({
        payment_status: 'received',
        amount_paid: total,
        amount_due: 0,
        payment_received_at: ts,
        payment_received_by: user.id,
        payment_notes: nextNotes ?? null,
        updated_at: ts,
      })
      .eq('id', bookingId)

    if (uErr) return adminActionDbFailed('adminMarkBookingPaymentReceivedAction', uErr)

    const ledger = await insertOpsRentalLedgerLine({
      admin,
      userId: booking.user_id,
      bookingId,
      title: 'Rental · full collection',
      amountRupees: total,
      metadata: {
        source: 'admin_console',
        kind: 'rental_full',
        actor_user_id: user.id,
        prior_payment_status: previous,
      },
    })
    if (!ledger.ok) return ledger

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'payment.rental_received',
      entityType: 'booking',
      entityId: bookingId,
      payload: { amount_rupees: total },
    })

    void onOpsPaymentLedger(bookingId, 'Rental marked received (full)')
    if (previous !== 'received') void onPaymentStatusChanged(bookingId, 'received', previous)

    revalidatePath('/admin/payments')
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath('/admin/bookings')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    revalidatePath('/dashboard/payments')
    return { ok: true }
  })
}

export async function adminMarkBookingPartialPaymentAction(input: {
  bookingId: string
  /** Cumulative rental collected in whole INR (not paise). */
  amountPaidRupees: number
  note?: string | null
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminMarkBookingPartialPaymentAction', 'payments', async () => {
    const guard = await requirePermissionForAdminAction('payments.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()
    const ts = new Date().toISOString()

    const paid = Math.round(Number(input.amountPaidRupees))
    if (!Number.isFinite(paid) || paid <= 0) {
      return { ok: false, message: 'Enter a valid collected amount greater than zero.' }
    }

    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select('user_id, total_rupees, payment_status, payment_notes')
      .eq('id', input.bookingId)
      .single()

    if (bErr || !booking) return { ok: false, message: 'Booking not found.' }

    const total = Math.max(0, Math.round(Number(booking.total_rupees ?? 0)))
    if (paid >= total) {
      return { ok: false, message: 'Amount equals or exceeds the booking total — use Mark payment received instead.' }
    }

    const previous = booking.payment_status ?? null
    const due = Math.max(0, total - paid)
    const nextNotes = input.note?.trim()
      ? appendStaffPaymentNote(booking.payment_notes, input.note.trim())
      : booking.payment_notes

    const { error: uErr } = await admin
      .from('bookings')
      .update({
        payment_status: 'partial',
        amount_paid: paid,
        amount_due: due,
        payment_received_at: ts,
        payment_received_by: user.id,
        payment_notes: nextNotes ?? null,
        updated_at: ts,
      })
      .eq('id', input.bookingId)

    if (uErr) return adminActionDbFailed('adminMarkBookingPartialPaymentAction', uErr)

    const ledger = await insertOpsRentalLedgerLine({
      admin,
      userId: booking.user_id,
      bookingId: input.bookingId,
      title: 'Rental · partial collection',
      amountRupees: paid,
      metadata: {
        source: 'admin_console',
        kind: 'rental_partial',
        actor_user_id: user.id,
        prior_payment_status: previous,
        total_rupees: total,
        amount_due_after: due,
      },
    })
    if (!ledger.ok) return ledger

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'payment.rental_partial',
      entityType: 'booking',
      entityId: input.bookingId,
      payload: { amount_paid_rupees: paid, amount_due_rupees: due },
    })

    void onOpsPaymentLedger(input.bookingId, 'Rental partial payment recorded')
    if (previous !== 'partial') void onPaymentStatusChanged(input.bookingId, 'partial', previous)

    revalidatePath('/admin/payments')
    revalidatePath(`/admin/bookings/${input.bookingId}`)
    revalidatePath('/admin/bookings')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    revalidatePath('/dashboard/payments')
    return { ok: true }
  })
}

export async function adminMarkBookingPaymentRefundedAction(
  bookingId: string,
  note?: string | null,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminMarkBookingPaymentRefundedAction', 'payments', async () => {
    const guard = await requirePermissionForAdminAction('payments.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()
    const ts = new Date().toISOString()

    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select('user_id, total_rupees, payment_status, payment_notes')
      .eq('id', bookingId)
      .single()

    if (bErr || !booking) return { ok: false, message: 'Booking not found.' }

    const total = Math.max(0, Math.round(Number(booking.total_rupees ?? 0)))
    const previous = booking.payment_status ?? null
    const line = note?.trim() ? `Marked refunded — ${note.trim()}` : 'Marked refunded'
    const nextNotes = appendStaffPaymentNote(booking.payment_notes, line)

    const { error: uErr } = await admin
      .from('bookings')
      .update({
        payment_status: 'refunded',
        amount_paid: 0,
        amount_due: 0,
        payment_received_at: null,
        payment_received_by: null,
        payment_notes: nextNotes,
        updated_at: ts,
      })
      .eq('id', bookingId)

    if (uErr) return adminActionDbFailed('adminMarkBookingPaymentRefundedAction', uErr)

    const ledger = await insertOpsRentalLedgerLine({
      admin,
      userId: booking.user_id,
      bookingId,
      title: 'Rental · refunded (ops)',
      amountRupees: total,
      metadata: {
        source: 'admin_console',
        kind: 'rental_refunded',
        actor_user_id: user.id,
        prior_payment_status: previous,
      },
    })
    if (!ledger.ok) return ledger

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'payment.rental_refunded',
      entityType: 'booking',
      entityId: bookingId,
    })

    void onOpsPaymentLedger(bookingId, 'Rental marked refunded')
    if (previous !== 'refunded') void onPaymentStatusChanged(bookingId, 'refunded', previous)

    revalidatePath('/admin/payments')
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath('/admin/bookings')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    revalidatePath('/dashboard/payments')
    return { ok: true }
  })
}

export async function adminCreateDepositHoldPlaceholderAction(bookingId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminCreateDepositHoldPlaceholderAction', 'payments', async () => {
    const guard = await requirePermissionForAdminAction('payments.write')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()

    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select('user_id, vehicle_id')
      .eq('id', bookingId)
      .single()

    if (bErr || !booking) return { ok: false, message: 'Booking not found.' }

    if (!booking.vehicle_id) {
      return { ok: false, message: 'This booking is not linked to a vehicle.' }
    }

    let depositRow: { security_deposit: number } | null = null

    const { data: vehicle, error: vErr } = await admin
      .from('vehicles')
      .select('security_deposit')
      .eq('id', booking.vehicle_id)
      .maybeSingle()
    if (!vErr && vehicle) {
      depositRow = vehicle
    } else {
      const { data: car, error: cErr } = await admin
        .from('cars')
        .select('security_deposit')
        .eq('id', booking.vehicle_id)
        .maybeSingle()
      if (cErr || !car) return { ok: false, message: 'Vehicle not found for this booking.' }
      depositRow = car
    }

    const amount = Number(depositRow.security_deposit ?? 0)
    if (!amount) return { ok: false, message: 'No security deposit configured for this vehicle.' }

    const metadata: Json = { source: 'admin_console', kind: 'deposit_hold_placeholder' }

    const { error } = await admin.from('payment_events').insert({
      user_id: booking.user_id,
      booking_id: bookingId,
      title: 'Security deposit hold (placeholder)',
      amount_rupees: amount,
      direction: 'deposit_hold',
      status: 'pending',
      metadata,
    })

    if (error) return adminActionDbFailed('adminCreateDepositHoldPlaceholderAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'payment.deposit_hold_placeholder',
      entityType: 'booking',
      entityId: bookingId,
    })

    void onOpsPaymentLedger(bookingId, 'Security deposit hold placeholder recorded')

    revalidatePath('/admin/payments')
    revalidatePath(`/admin/bookings/${bookingId}`)
    return { ok: true }
  })
}
