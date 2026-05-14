import 'server-only'

import { adminGetBooking } from '@/lib/admin/data/bookings'
import { getBookingForUser } from '@/lib/customer/bookings-queries'
import { buildBookingPdfPayload, type BookingPdfDocKind } from '@/lib/pdf/booking-payload'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function loadCustomerBookingPdfPayload(
  bookingId: string,
  userId: string,
  doc: BookingPdfDocKind,
) {
  const row = await getBookingForUser(bookingId, userId)
  if (!row) return null
  const supabase = await createClient()
  const [{ data: profile }, { data: userData }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('user_id', userId).maybeSingle(),
    supabase.auth.getUser(),
  ])
  const email = userData?.user?.email ?? null
  return buildBookingPdfPayload(row, doc, {
    name: profile?.full_name ?? null,
    email,
    phone: profile?.phone ?? null,
  })
}

export async function loadAdminBookingPdfPayload(bookingId: string, doc: BookingPdfDocKind) {
  const row = await adminGetBooking(bookingId)
  if (!row) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('full_name, phone').eq('user_id', row.user_id).maybeSingle()
  let email: string | null = null
  try {
    const { data } = await admin.auth.admin.getUserById(row.user_id)
    email = data?.user?.email ?? null
  } catch {
    email = null
  }
  return buildBookingPdfPayload(row, doc, {
    name: profile?.full_name ?? null,
    email,
    phone: profile?.phone ?? null,
  })
}
