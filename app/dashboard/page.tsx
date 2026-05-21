import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { CustomerDashboardHome } from '@/features/dashboard/customer-dashboard-home'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { isStaffRole } from '@/lib/auth/permissions'
import { ADMIN_HOME } from '@/lib/auth/routes'
import { listBookingsForUser, unwrapListBookingsResult } from '@/lib/customer/bookings-queries'
import { listKycDocuments } from '@/lib/customer/kyc-queries'
import { getCustomerProfileSnapshot } from '@/lib/customer/profile-queries'
import { isProfileKycApprovedForBooking } from '@/lib/kyc/kyc-booking-eligible'
import { logUnknownError } from '@/lib/errors/safe-user-message'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your Oxour Go member hub — bookings, verification, and trip details in one place.',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const summary = await getAuthSessionSummary()
  if (!summary) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard' }).toString()}`)
  }
  if (isStaffRole(summary.appRole)) {
    redirect(ADMIN_HOME)
  }
  const { user } = summary

  const q = await searchParams
  const accessNotice =
    q.error === 'forbidden'
      ? 'That area is restricted to operations staff. You are on your member dashboard.'
      : null

  try {
    const [bookingsResult, kycDocs, profile] = await Promise.all([
      listBookingsForUser(user.id),
      listKycDocuments(user.id),
      getCustomerProfileSnapshot(user.id),
    ])

    const bookingCleared = isProfileKycApprovedForBooking(profile)

    return (
      <CustomerDashboardHome
        bookings={unwrapListBookingsResult(bookingsResult)}
        kycUploadedCount={kycDocs.length}
        verificationTier={profile.verification_tier}
        kycStatus={profile.kyc_status}
        bookingCleared={bookingCleared}
        accessNotice={accessNotice}
      />
    )
  } catch (error) {
    logUnknownError('[dashboard page]', error)
    return (
      <CustomerDashboardHome
        bookings={[]}
        kycUploadedCount={0}
        verificationTier="basic"
        kycStatus="not_started"
        bookingCleared={false}
        accessNotice={accessNotice}
      />
    )
  }
}
