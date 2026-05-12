import { notFound } from 'next/navigation'

import { getCarById } from '@/data/cars'
import { CarDetailView } from '@/features/car/car-detail-view'
import { getFleetCarById } from '@/lib/fleet/get-fleet-car-by-id'
import { isUuid } from '@/lib/fleet/is-uuid'

export const dynamic = 'force-dynamic'

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let car = await getFleetCarById(id)
  if (!car && !isUuid(id)) {
    car = getCarById(id) ?? null
  }

  if (!car) {
    notFound()
  }

  return <CarDetailView car={car} />
}
