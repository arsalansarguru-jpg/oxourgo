import { Suspense } from 'react'

import { FleetView } from '@/features/fleet/fleet-view'
import { FleetLoading } from '@/features/fleet/fleet-loading'

export const dynamic = 'force-dynamic'

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
