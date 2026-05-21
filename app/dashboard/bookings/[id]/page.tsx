import { notFound, redirect } from 'next/navigation'

import { BookingRealtimeSubscriber } from '@/features/dashboard/booking-realtime-subscriber'
import { CustomerBookingDetail } from '@/features/dashboard/customer-booking-detail'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { customerGetBookingViolationsBundle } from '@/lib/customer/violations-queries'
import { signBookingInspectionObjectForUser, signBookingInspectionPhotosForUser } from '@/lib/customer/booking-inspection-urls'
import { getBookingForUser, listInspectionPhotosForBooking } from '@/lib/customer/bookings-queries'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CustomerBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  const { id } = await params
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: `/dashboard/bookings/${id}` }).toString()}`)
  }
  const row = await getBookingForUser(id, user.id)
  if (!row) {
    notFound()
  }

  const supabase = await createClient()
  const photoRows = await listInspectionPhotosForBooking(id)
  const signedPhotos = await signBookingInspectionPhotosForUser(supabase, photoRows)
  const inspection = {
    photos: signedPhotos.map((p) => ({ phase: p.phase, slot: p.slot, url: p.signedUrl })),
    signatureUrl: await signBookingInspectionObjectForUser(supabase, row.customer_handover_signature_path),
  }
  const violationsBundle = await customerGetBookingViolationsBundle(id, user.id)

  return (
    <>
      <BookingRealtimeSubscriber bookingId={row.id} />
      <CustomerBookingDetail row={row} inspection={inspection} violationsBundle={violationsBundle} />
    </>
  )
}
