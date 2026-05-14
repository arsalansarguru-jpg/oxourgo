import { notFound } from 'next/navigation'

import { CarDetailView } from '@/features/car/car-detail-view'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { getFleetCarById } from '@/lib/fleet/get-fleet-car-by-id'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [car, user] = await Promise.all([getFleetCarById(id), getAuthenticatedUser()])
  if (!car) {
    notFound()
  }

  let kycApproved = false
  if (user) {
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('verification_tier')
      .eq('user_id', user.id)
      .maybeSingle()
    kycApproved = (profile?.verification_tier ?? '') === 'verified'
  }

  return <CarDetailView car={car} isLoggedIn={Boolean(user)} kycApproved={kycApproved} />
}
