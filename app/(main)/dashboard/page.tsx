import { redirect } from 'next/navigation'

import { CustomerDashboardHome } from '@/features/dashboard/customer-dashboard-home'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { listBookingsForUser, unwrapListBookingsResult } from '@/lib/customer/bookings-queries'
import { listKycDocuments } from '@/lib/customer/kyc-queries'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard' }).toString()}`)
  }

  const supabase = await createClient()
  const [bookingsResult, kycDocs, profileRes] = await Promise.all([
    listBookingsForUser(user.id),
    listKycDocuments(user.id),
    supabase.from('profiles').select('verification_tier').eq('user_id', user.id).maybeSingle(),
  ])

  const verificationTier = (profileRes.data?.verification_tier as string | undefined) ?? 'basic'

  return (
    <CustomerDashboardHome
      bookings={unwrapListBookingsResult(bookingsResult)}
      kycUploadedCount={kycDocs.length}
      verificationTier={verificationTier}
    />
  )
}
