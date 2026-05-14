import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { CustomerDashboardHome } from '@/features/dashboard/customer-dashboard-home'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { listBookingsForUser, unwrapListBookingsResult } from '@/lib/customer/bookings-queries'
import { listKycDocuments } from '@/lib/customer/kyc-queries'
import { isProfileKycApprovedForBooking } from '@/lib/kyc/kyc-booking-eligible'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your Oxour Go member hub — bookings, verification, and trip details in one place.',
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard' }).toString()}`)
  }

  const supabase = await createClient()
  const [bookingsResult, kycDocs, profileRes] = await Promise.all([
    listBookingsForUser(user.id),
    listKycDocuments(user.id),
    supabase.from('profiles').select('verification_tier, kyc_status').eq('user_id', user.id).maybeSingle(),
  ])

  const profile = profileRes.data
  const verificationTier = (profile?.verification_tier as string | undefined) ?? 'basic'
  const kycStatus = (profile?.kyc_status as string | undefined) ?? 'not_started'
  const bookingCleared = isProfileKycApprovedForBooking(profile)

  return (
    <CustomerDashboardHome
      bookings={unwrapListBookingsResult(bookingsResult)}
      kycUploadedCount={kycDocs.length}
      verificationTier={verificationTier}
      kycStatus={kycStatus}
      bookingCleared={bookingCleared}
    />
  )
}
