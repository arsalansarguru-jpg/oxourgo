import 'server-only'

import { adminGetBooking } from '@/lib/admin/data/bookings'
import { getBookingForUser } from '@/lib/customer/bookings-queries'
import { resolveCustomerDisplayName } from '@/lib/customer/display-name'
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
    supabase.from('profiles').select('full_name, display_name, phone').eq('user_id', userId).maybeSingle(),
    supabase.auth.getUser(),
  ])
  const email = userData?.user?.email ?? null
  const resolvedName = resolveCustomerDisplayName({
    userId,
    fullName: profile?.full_name,
    displayName: profile?.display_name,
    email,
    phone: profile?.phone,
    authMetadata: userData?.user?.user_metadata,
  })

  return buildBookingPdfPayload(row, doc, {
    name: resolvedName,
    email,
    phone: profile?.phone ?? null,
  })
}

export async function loadAdminBookingPdfPayload(bookingId: string, doc: BookingPdfDocKind) {
  const row = await adminGetBooking(bookingId)
  if (!row) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('full_name, display_name, phone').eq('user_id', row.user_id).maybeSingle()
  let email: string | null = null
  let authMetadata: { full_name?: string; name?: string; display_name?: string } | null = null
  try {
    const { data } = await admin.auth.admin.getUserById(row.user_id)
    email = data?.user?.email ?? null
    authMetadata = data?.user?.user_metadata ?? null
  } catch {
    email = null
  }
  const resolvedName = resolveCustomerDisplayName({
    userId: row.user_id,
    fullName: profile?.full_name,
    displayName: profile?.display_name,
    email,
    phone: profile?.phone,
    authMetadata,
  })

  return buildBookingPdfPayload(row, doc, {
    name: resolvedName,
    email,
    phone: profile?.phone ?? null,
  })
}
