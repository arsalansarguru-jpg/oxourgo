import { redirect } from 'next/navigation'

import { CustomerBookingsDashboard } from '@/features/dashboard/customer-bookings-dashboard'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { listBookingsForUser } from '@/lib/customer/bookings-queries'

export const dynamic = 'force-dynamic'

export default async function CustomerBookingsPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard/bookings' }).toString()}`)
  }
  const result = await listBookingsForUser(user.id)
  return <CustomerBookingsDashboard result={result} />
}
