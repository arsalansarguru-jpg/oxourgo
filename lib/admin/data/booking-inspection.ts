import 'server-only'

import type { Database } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type BookingInspectionPhotoRow = Database['public']['Tables']['booking_inspection_photos']['Row']
export type BookingInspectionEventRow = Database['public']['Tables']['booking_inspection_events']['Row']

export async function adminListBookingInspectionPhotos(bookingId: string): Promise<BookingInspectionPhotoRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('booking_inspection_photos')
    .select('*')
    .eq('booking_id', bookingId)
    .order('phase')
    .order('slot')

  if (error) {
    logPostgrestError('[adminListBookingInspectionPhotos]', error)
    return []
  }
  return (data ?? []) as BookingInspectionPhotoRow[]
}

export async function adminListBookingInspectionEvents(bookingId: string): Promise<BookingInspectionEventRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('booking_inspection_events')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    logPostgrestError('[adminListBookingInspectionEvents]', error)
    return []
  }
  return (data ?? []) as BookingInspectionEventRow[]
}

export type AdminInspectionBundle = {
  photos: BookingInspectionPhotoRow[]
  events: BookingInspectionEventRow[]
  photoSignedUrls: Record<string, string>
  signatureSignedUrl: string | null
}

const SIGN_TTL = 3600

export async function adminGetBookingInspectionBundle(
  bookingId: string,
  signaturePath: string | null | undefined,
): Promise<AdminInspectionBundle> {
  const admin = createAdminClient()
  const [photos, events] = await Promise.all([
    adminListBookingInspectionPhotos(bookingId),
    adminListBookingInspectionEvents(bookingId),
  ])

  const photoSignedUrls: Record<string, string> = {}
  for (const p of photos) {
    const { data, error } = await admin.storage.from('booking_inspection').createSignedUrl(p.storage_path, SIGN_TTL)
    if (!error && data?.signedUrl) photoSignedUrls[p.id] = data.signedUrl
  }

  let signatureSignedUrl: string | null = null
  const sp = signaturePath?.trim()
  if (sp) {
    const { data, error } = await admin.storage.from('booking_inspection').createSignedUrl(sp, SIGN_TTL)
    if (!error && data?.signedUrl) signatureSignedUrl = data.signedUrl
  }

  return { photos, events, photoSignedUrls, signatureSignedUrl }
}
