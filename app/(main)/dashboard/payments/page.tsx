import { redirect } from 'next/navigation'

import { CustomerPaymentsView } from '@/features/dashboard/customer-payments-view'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { listBookingsForUser } from '@/lib/customer/bookings-queries'
import { listPaymentEvents } from '@/lib/customer/payment-queries'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard/payments' }).toString()}`)
  }
  const [bookings, events] = await Promise.all([
    listBookingsForUser(user.id),
    listPaymentEvents(user.id),
  ])
  return <CustomerPaymentsView bookings={bookings} events={events} />
}
