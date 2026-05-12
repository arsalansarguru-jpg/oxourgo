import { redirect } from 'next/navigation'

import { CustomerBookingsList } from '@/features/dashboard/customer-bookings-list'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { listBookingsForUser } from '@/lib/customer/bookings-queries'

export const dynamic = 'force-dynamic'

export default async function CustomerBookingsPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard/bookings' }).toString()}`)
  }
  const bookings = await listBookingsForUser(user.id)
  return <CustomerBookingsList bookings={bookings} />
}
