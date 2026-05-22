import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { CustomerBookingsDashboard } from '@/features/dashboard/customer-bookings-dashboard'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { listBookingsForUser } from '@/lib/customer/bookings-queries'
import { listKycDocuments } from '@/lib/customer/kyc-queries'
import { getCustomerProfileSnapshot } from '@/lib/customer/profile-queries'
import { buildKycUiSnapshot } from '@/lib/kyc/kyc-ui-snapshot'
import { isProfileKycApprovedForBooking } from '@/lib/kyc/kyc-booking-eligible'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My bookings',
  description: 'View and manage your Oxour Go reservations.',
}

export default async function CustomerBookingsPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard/bookings' }).toString()}`)
  }
  const [result, profile, kycDocs] = await Promise.all([
    listBookingsForUser(user.id),
    getCustomerProfileSnapshot(user.id),
    listKycDocuments(user.id).catch(() => []),
  ])

  const bookingCleared = isProfileKycApprovedForBooking(profile)
  const kycUi = buildKycUiSnapshot({
    profileKycStatus: profile.kyc_status,
    docs: kycDocs,
    bookingCleared,
  })

  return (
    <CustomerBookingsDashboard
      result={result}
      bookingCleared={bookingCleared}
      kycStatus={kycUi.badgeStatus}
    />
  )
}
