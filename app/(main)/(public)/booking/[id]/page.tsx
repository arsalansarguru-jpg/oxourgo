import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BookingView } from '@/features/booking/booking-view'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { defaultPickupReturnIso } from '@/lib/booking/dates'
import { getFleetCarById } from '@/lib/fleet/get-fleet-car-by-id'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Plan a trip',
  description: 'Configure pickup, return, and hubs for your Oxour Go self-drive reservation.',
  robots: { index: false, follow: false },
}

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const car = await getFleetCarById(id)
  if (!car) {
    notFound()
  }

  const user = await getAuthenticatedUser()
  const defaults = defaultPickupReturnIso()

  return (
    <BookingView
      car={car}
      defaultPickupIso={defaults.pickup}
      defaultReturnIso={defaults.return}
      isLoggedIn={Boolean(user)}
      userEmail={user?.email ?? null}
    />
  )
}
