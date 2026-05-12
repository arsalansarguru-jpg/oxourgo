import { redirect } from 'next/navigation'

import { CustomerDashboardHome } from '@/features/dashboard/customer-dashboard-home'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { listBookingsForUser } from '@/lib/customer/bookings-queries'
import { listKycDocuments } from '@/lib/customer/kyc-queries'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard' }).toString()}`)
  }

  const [bookings, kycDocs] = await Promise.all([
    listBookingsForUser(user.id),
    listKycDocuments(user.id),
  ])

  return <CustomerDashboardHome bookings={bookings} kycUploadedCount={kycDocs.length} />
}
