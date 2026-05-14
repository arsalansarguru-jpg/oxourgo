import type { Metadata } from 'next'
import { Suspense } from 'react'

import { FleetView } from '@/features/fleet/fleet-view'
import { FleetLoading } from '@/features/fleet/fleet-loading'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Fleet',
  description:
    'Browse the Oxour Go luxury fleet — SUVs, sedans, and premium vehicles with live availability and clear daily rates.',
  openGraph: {
    title: 'Luxury fleet | Oxour Go',
    description:
      'Browse the Oxour Go luxury fleet — SUVs, sedans, and premium vehicles with live availability and clear daily rates.',
  },
}

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<{ pickup?: string; from?: string; to?: string; location?: string; q?: string }>
}) {
  const q = await searchParams

  return (
    <Suspense fallback={<FleetLoading />}>
      <FleetView pickup={q.pickup} from={q.from} to={q.to} location={q.location} searchQuery={q.q} />
    </Suspense>
  )
}
