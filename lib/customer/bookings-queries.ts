import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { BookingWithCar } from '@/lib/supabase/database.types'

const bookingSelect = `
  id,
  vehicle_id,
  user_id,
  pickup_date,
  return_date,
  pickup_location,
  return_location,
  rental_days,
  price_per_day_rupees_snapshot,
  subtotal_rupees,
  convenience_fee_rupees,
  gst_rupees,
  total_rupees,
  booking_status,
  payment_method,
  payment_status,
  amount_due,
  amount_paid,
  payment_received_at,
  payment_received_by,
  payment_notes,
  ops_note,
  approved_at,
  handed_over_at,
  returned_at,
  completed_at,
  pickup_checklist,
  return_checklist,
  pickup_fuel_level,
  return_fuel_level,
  pickup_odometer_km,
  return_odometer_km,
  pickup_condition_notes,
  return_condition_notes,
  deposit_amount,
  deposit_status,
  deposit_held_rupees,
  deposit_refunded_at,
  deposit_refunded_rupees,
  deposit_received_at,
  refund_amount,
  refund_processed_at,
  penalty_total,
  penalty_damage_rupees,
  penalty_late_rupees,
  penalty_extra_km_rupees,
  penalty_fuel_rupees,
  penalty_cleaning_rupees,
  penalty_traffic_rupees,
  deposit_penalty_total_rupees,
  deductions,
  customer_handover_signature_path,
  customer_handover_signed_at,
  pickup_inspection_completed_at,
  return_inspection_completed_at,
  created_at,
  updated_at,
  vehicles (
    id,
    name,
    brand,
    price_per_day,
    image,
    available,
    transmission,
    fuel_type,
    seats,
    year,
    registration_number,
    security_deposit
  )
`

export type ListBookingsForUserError = {
  code: 'query_failed'
  message: string
}

export type ListBookingsForUserResult =
  | { ok: true; data: BookingWithCar[] }
  | { ok: false; error: ListBookingsForUserError }

export function unwrapListBookingsResult(result: ListBookingsForUserResult): BookingWithCar[] {
  return result.ok ? result.data : []
}

export async function listBookingsForUser(userId: string): Promise<ListBookingsForUserResult> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(bookingSelect)
    .eq('user_id', userId)
    .order('pickup_date', { ascending: false })

  if (error) {
    console.error('[listBookingsForUser]', error.message, error.code, error.details)
    return {
      ok: false,
      error: { code: 'query_failed', message: 'Unable to load reservations.' },
    }
  }
  return { ok: true, data: (data ?? []) as unknown as BookingWithCar[] }
}

export async function getBookingForUser(bookingId: string, userId: string): Promise<BookingWithCar | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(bookingSelect)
    .eq('id', bookingId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as BookingWithCar
}

export type CustomerInspectionPhotoRow = {
  id: string
  phase: string
  slot: string
  storage_path: string
}

/** RLS: rows only for bookings the current user owns. */
export async function listInspectionPhotosForBooking(bookingId: string): Promise<CustomerInspectionPhotoRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('booking_inspection_photos')
    .select('id, phase, slot, storage_path')
    .eq('booking_id', bookingId)
    .order('phase')
    .order('slot')

  if (error) {
    console.error('[listInspectionPhotosForBooking]', error.message)
    return []
  }
  return (data ?? []) as CustomerInspectionPhotoRow[]
}
