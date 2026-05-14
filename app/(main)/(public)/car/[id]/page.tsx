import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CarDetailView } from '@/features/car/car-detail-view'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { getFleetCarById } from '@/lib/fleet/get-fleet-car-by-id'
import { isProfileKycApprovedForBooking } from '@/lib/kyc/kyc-booking-eligible'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const car = await getFleetCarById(id)
  if (!car) {
    return { title: 'Vehicle' }
  }
  const title = `${car.name} — self-drive in Mumbai`
  const description =
    car.description.length > 155 ? `${car.description.slice(0, 152)}…` : car.description
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: car.imageUrl ? [{ url: car.imageUrl }] : undefined,
    },
  }
}

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [car, user] = await Promise.all([getFleetCarById(id), getAuthenticatedUser()])
  if (!car) {
    notFound()
  }

  let kycApproved = false
  let kycStatus: string | null = null
  if (user) {
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('verification_tier, kyc_status')
      .eq('user_id', user.id)
      .maybeSingle()
    kycApproved = isProfileKycApprovedForBooking(profile)
    kycStatus = (profile?.kyc_status as string | undefined) ?? null
  }

  return <CarDetailView car={car} isLoggedIn={Boolean(user)} kycApproved={kycApproved} kycStatus={kycStatus} />
}
