import { redirect } from 'next/navigation'

import { CustomerBookingsDashboard } from '@/features/dashboard/customer-bookings-dashboard'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { listBookingsForUser } from '@/lib/customer/bookings-queries'
import { isProfileKycApprovedForBooking } from '@/lib/kyc/kyc-booking-eligible'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CustomerBookingsPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard/bookings' }).toString()}`)
  }
  const result = await listBookingsForUser(user.id)
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('verification_tier, kyc_status')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <CustomerBookingsDashboard
      result={result}
      bookingCleared={isProfileKycApprovedForBooking(profile)}
      kycStatus={(profile?.kyc_status as string | undefined) ?? 'not_started'}
    />
  )
}
