import { notFound, redirect } from 'next/navigation'

import { CustomerBookingDetail } from '@/features/dashboard/customer-booking-detail'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { getBookingForUser } from '@/lib/customer/bookings-queries'

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
  return <CustomerBookingDetail row={row} />
}
