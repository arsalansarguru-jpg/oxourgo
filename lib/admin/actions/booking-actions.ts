'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { requireAppRole } from '@/lib/auth/server'
import {
  onBookingApproved,
  onBookingCancelled,
  onBookingRejected,
  onPaymentStatusChanged,
} from '@/lib/notifications/events'
import type { Database } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminActionDbFailed } from '@/lib/errors/safe-user-message'

const PAYMENT_STATUSES = ['pending', 'authorized', 'paid', 'failed', 'refunded'] as const
const BOOKING_STATUSES = ['pending_payment', 'confirmed', 'cancelled', 'completed'] as const

function nowIso() {
  return new Date().toISOString()
}

/** Shared: pending_payment → confirmed with audit + notifications (approve / mark active). */
async function confirmPendingBookingFromAdmin(bookingId: string, actorUserId: string): Promise<AdminActionResult> {
  const admin = createAdminClient()

  const { data: row, error: fetchErr } = await admin.from('bookings').select('booking_status').eq('id', bookingId).single()
  if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
  if (row.booking_status !== 'pending_payment') {
    return { ok: false, message: 'Only pending requests can be approved.' }
  }

  const { error } = await admin
    .from('bookings')
    .update({ booking_status: 'confirmed', updated_at: nowIso() })
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
  return { ok: true }
}

export async function adminApproveBookingAction(bookingId: string): Promise<AdminActionResult> {
  const { user } = await requireAppRole('ops_admin')
  return confirmPendingBookingFromAdmin(bookingId, user.id)
}

/**
 * Idempotent “active” = confirmed in this schema.
 * Pending → same path as approve (notifications). Already confirmed → success no-op.
 */
export async function adminMarkBookingActiveAction(bookingId: string): Promise<AdminActionResult> {
  const { user } = await requireAppRole('ops_admin')
  const admin = createAdminClient()

  const { data: row, error: fetchErr } = await admin.from('bookings').select('booking_status').eq('id', bookingId).single()
  if (fetchErr || !row) return { ok: false, message: 'Booking not found.' }
  if (row.booking_status === 'confirmed') return { ok: true }
  if (row.booking_status === 'cancelled' || row.booking_status === 'completed') {
    return { ok: false, message: 'Booking cannot be marked active in this state.' }
  }
  if (row.booking_status !== 'pending_payment') {
    return { ok: false, message: 'Only pending bookings can be marked active.' }
  }

  return confirmPendingBookingFromAdmin(bookingId, user.id)
}

export async function adminRejectBookingAction(bookingId: string, note?: string): Promise<AdminActionResult> {
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
  return { ok: true }
}

export async function adminCancelBookingAction(bookingId: string, note?: string): Promise<AdminActionResult> {
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
  return { ok: true }
}

export async function adminSetBookingPaymentStatusAction(
  bookingId: string,
  payment_status: string,
): Promise<AdminActionResult> {
  const { user } = await requireAppRole('ops_admin')
  if (!(PAYMENT_STATUSES as readonly string[]).includes(payment_status)) {
    return { ok: false, message: 'Invalid payment status.' }
  }

  const admin = createAdminClient()
  const { data: prevRow } = await admin.from('bookings').select('payment_status').eq('id', bookingId).maybeSingle()
  const previous = prevRow?.payment_status ?? null

  const patch: Database['public']['Tables']['bookings']['Update'] = {
    payment_status,
    updated_at: nowIso(),
  }
  const { error } = await admin.from('bookings').update(patch).eq('id', bookingId)

  if (error) return adminActionDbFailed('adminSetBookingPaymentStatusAction', error)

  if (previous !== payment_status) {
    void onPaymentStatusChanged(bookingId, payment_status, previous)
  }

  await writeAdminAudit({
    actorUserId: user.id,
    action: 'booking.payment_status',
    entityType: 'booking',
    entityId: bookingId,
    payload: { payment_status },
  })

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/payments')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function adminSetBookingStatusAction(
  bookingId: string,
  booking_status: string,
): Promise<AdminActionResult> {
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
  return { ok: true }
}
