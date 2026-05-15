import 'server-only'

import type { Database } from '@/lib/supabase/database.types'
import { adminListBookingsPage, type AdminBookingListItem } from '@/lib/admin/data/bookings'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type PaymentEventRow = Database['public']['Tables']['payment_events']['Row']

export type PaymentsBoardFilter = 'all' | 'pending' | 'received' | 'partial' | 'refunded'

export type AdminPaymentOpsMetrics = {
  pendingCollectionRupees: number
  collectedRentalRupees: number
  pendingBookingCount: number
  /** Gross rental on bookings still in `pending` payment (no partial pay yet). */
  grossPendingContractRupees: number
}

export async function adminPaymentOperationsMetrics(): Promise<AdminPaymentOpsMetrics> {
  const admin = createAdminClient()
  let pendingCollectionRupees = 0
  let collectedRentalRupees = 0
  let pendingBookingCount = 0
  let grossPendingContractRupees = 0

  const pageSize = 4000
  for (let from = 0, guard = 0; guard < 60; guard++) {
    const { data, error } = await admin
      .from('bookings')
      .select('booking_status, payment_status, amount_due, amount_paid, total_rupees')
      .range(from, from + pageSize - 1)

    if (error) {
      logPostgrestError('[adminPaymentOperationsMetrics]', error)
      break
    }
    const rows = data ?? []
    for (const r of rows as {
      booking_status: string
      payment_status: string
      amount_due: number | null
      amount_paid: number | null
      total_rupees: number | null
    }[]) {
      const cancelled = r.booking_status.trim().toLowerCase() === 'cancelled'
      const st = r.payment_status.trim().toLowerCase()
      const due = Math.max(0, Math.round(Number(r.amount_due ?? 0)))
      const paid = Math.max(0, Math.round(Number(r.amount_paid ?? 0)))
      const gross = Math.max(0, Math.round(Number(r.total_rupees ?? 0)))
      if (!cancelled && (st === 'pending' || st === 'partial')) {
        pendingBookingCount += 1
        pendingCollectionRupees += due
      }
      if (!cancelled && st === 'pending') {
        grossPendingContractRupees += gross
      }
      if (!cancelled && (st === 'received' || st === 'partial')) {
        collectedRentalRupees += paid
      }
    }
    if (rows.length < pageSize) break
    from += pageSize
  }

  return { pendingCollectionRupees, collectedRentalRupees, pendingBookingCount, grossPendingContractRupees }
}

export async function adminListPaymentEvents(limit = 150): Promise<PaymentEventRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('payment_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logPostgrestError('[adminListPaymentEvents]', error)
    return []
  }
  return data as PaymentEventRow[]
}

export async function adminListPaymentEventsForBooking(bookingId: string): Promise<PaymentEventRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('payment_events')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(80)

  if (error) {
    logPostgrestError('[adminListPaymentEventsForBooking]', error)
    return []
  }
  return (data ?? []) as PaymentEventRow[]
}

export type BookingPaymentSummary = {
  payment_status: string
  count: number
}

export async function adminBookingPaymentSummary(): Promise<BookingPaymentSummary[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('bookings').select('payment_status')
  if (error) {
    logPostgrestError('[adminBookingPaymentSummary]', error)
    return []
  }
  if (!data) return []

  const map = new Map<string, number>()
  for (const row of data as { payment_status: string }[]) {
    map.set(row.payment_status, (map.get(row.payment_status) ?? 0) + 1)
  }
  return [...map.entries()].map(([payment_status, count]) => ({ payment_status, count }))
}

export async function adminPaymentsBoardRows(filter: PaymentsBoardFilter): Promise<AdminBookingListItem[]> {
  const { rows } = await adminListBookingsPage({
    page: 1,
    pageSize: 100,
    payment_status: filter === 'all' ? undefined : filter,
  })
  return rows
}
