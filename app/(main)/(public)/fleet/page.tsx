import type { Metadata } from 'next'
import { Suspense } from 'react'

import { FleetPageContent } from '@/features/fleet/fleet-page-content'
import { FleetLoading } from '@/features/fleet/fleet-loading'
import { buildPageMetadata } from '@/lib/seo/build-page-metadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; location?: string; q?: string }>
}): Promise<Metadata> {
  const q = await searchParams
  const bits: string[] = []
  if (q.q?.trim()) bits.push(`"${q.q.trim()}"`)
  if (q.location?.trim()) bits.push(`Near ${q.location.trim()}`)
  if (q.from && q.to) bits.push(`${q.from} → ${q.to}`)
  const title = bits.length ? `Fleet · ${bits.join(' · ')}` : 'Luxury self-drive fleet Mumbai'
  const description =
    bits.length > 0
      ? `Browse Oxour Go vehicles (${bits.join(' · ')}) — verified listings, live availability, transparent daily rates in Mumbai.`
      : 'Browse the Oxour Go luxury fleet — SUVs, sedans, and premium vehicles with live availability and clear daily rates in Mumbai.'
  return buildPageMetadata({
    title,
    description,
    path: '/fleet',
    keywords: ['fleet Mumbai', 'SUV rental', 'luxury sedan', ...(q.q?.trim() ? [q.q.trim()] : [])],
  })
}

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; location?: string; q?: string }>
}) {
  const q = await searchParams

  return (
    <Suspense fallback={<FleetLoading />}>
      <FleetPageContent
        from={q.from}
        to={q.to}
        location={q.location}
        searchQuery={q.q}
      />
    </Suspense>
  )
}
