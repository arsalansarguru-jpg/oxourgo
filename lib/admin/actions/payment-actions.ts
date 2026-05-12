'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { requireAppRole } from '@/lib/auth/server'
import { onOpsPaymentLedger } from '@/lib/notifications/events'
import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

export async function adminCreateRefundPlaceholderAction(bookingId: string): Promise<AdminActionResult> {
  const { user } = await requireAppRole('ops_admin')
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

  if (error) return { ok: false, message: error.message }

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
}

export async function adminCreateDepositHoldPlaceholderAction(bookingId: string): Promise<AdminActionResult> {
  const { user } = await requireAppRole('ops_admin')
  const admin = createAdminClient()

  const { data: booking, error: bErr } = await admin.from('bookings').select('user_id, car_id').eq('id', bookingId).single()

  if (bErr || !booking) return { ok: false, message: 'Booking not found.' }

  const { data: car, error: cErr } = await admin
    .from('cars')
    .select('security_deposit')
    .eq('id', booking.car_id)
    .maybeSingle()

  if (cErr || !car) return { ok: false, message: 'Vehicle not found for this booking.' }

  const amount = Number(car.security_deposit ?? 0)
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

  if (error) return { ok: false, message: error.message }

  await writeAdminAudit({
    actorUserId: user.id,
    action: 'payment.deposit_placeholder',
    entityType: 'booking',
    entityId: bookingId,
  })

  void onOpsPaymentLedger(bookingId, 'Security deposit hold placeholder recorded')

  revalidatePath('/admin/payments')
  revalidatePath(`/admin/bookings/${bookingId}`)
  return { ok: true }
}
