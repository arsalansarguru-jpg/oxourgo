import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { JsonLdScript } from '@/components/seo/json-ld-script'
import { CarDetailView } from '@/features/car/car-detail-view'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { buildCarProductJsonLd } from '@/lib/seo/car-product-json-ld'
import { buildPageMetadata } from '@/lib/seo/build-page-metadata'
import { getFleetCarById } from '@/lib/fleet/get-fleet-car-by-id'
import { getMetadataSiteUrl } from '@/lib/seo/site-metadata'
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
    return buildPageMetadata({
      title: 'Vehicle',
      description: 'Vehicle listing on Oxour Go.',
      path: `/car/${id}`,
      robots: { index: false, follow: true },
    })
  }
  const title = `${car.name} — self-drive in Mumbai`
  const description =
    car.description.length > 160 ? `${car.description.slice(0, 157)}…` : car.description
  return buildPageMetadata({
    title,
    description,
    path: `/car/${car.id}`,
    keywords: [car.name, car.category, 'self drive Mumbai', 'luxury rental'],
    ogImage: car.imageUrl,
  })
}

export default async function CarDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { id } = await params
  const q = await searchParams

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

  const jsonLd = buildCarProductJsonLd(car, getMetadataSiteUrl())

  return (
    <>
      <JsonLdScript id={`car-product-jsonld-${car.id}`} data={jsonLd} />
      <CarDetailView
        car={car}
        isLoggedIn={Boolean(user)}
        kycApproved={kycApproved}
        kycStatus={kycStatus}
        tripFrom={q.from}
        tripTo={q.to}
      />
    </>
  )
}
