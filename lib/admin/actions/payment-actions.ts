'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { requireAppRole } from '@/lib/auth/server'
import { onOpsPaymentLedger } from '@/lib/notifications/events'
import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminActionDbFailed } from '@/lib/errors/safe-user-message'

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

  if (error) return adminActionDbFailed('adminCreateRefundPlaceholderAction', error)

  await writeAdminAudit({
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
    entityType: 'booking',
    entityId: bookingId,
  })

  void onOpsPaymentLedger(bookingId, 'Security deposit hold placeholder recorded')

  revalidatePath('/admin/payments')
  revalidatePath(`/admin/bookings/${bookingId}`)
  return { ok: true }
}
