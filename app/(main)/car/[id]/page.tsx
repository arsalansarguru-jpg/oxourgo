import { notFound } from 'next/navigation'

import { CarDetailView } from '@/features/car/car-detail-view'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { getFleetCarById } from '@/lib/fleet/get-fleet-car-by-id'

export const dynamic = 'force-dynamic'

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [car, user] = await Promise.all([getFleetCarById(id), getAuthenticatedUser()])
  if (!car) {
    notFound()
  }

  return (
    <CarDetailView car={car} isLoggedIn={Boolean(user)} userEmail={user?.email ?? null} />
  )
}
