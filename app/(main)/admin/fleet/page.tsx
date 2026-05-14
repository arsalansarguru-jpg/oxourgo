import { AdminFleetManager } from '@/components/admin/fleet/admin-fleet-manager'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { adminGetFleetDashboardMetrics, adminListVehiclesPage } from '@/lib/admin/data/fleet'

export const dynamic = 'force-dynamic'

const PAGE_SIZE_OPTIONS = [12, 24, 36, 48] as const

function parseIntSafe(v: string | undefined, fallback: number): number {
  const n = Number.parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

export default async function AdminFleetPage({
  searchParams,
}: {
  searchParams: Promise<{
    add?: string
    q?: string
    page?: string
    per?: string
    avail?: string
    feat?: string
    view?: string
  }>
}) {
  const q = await searchParams
  const initialOpenAdd = q.add === '1'

  const searchRaw = typeof q.q === 'string' ? q.q.trim().slice(0, 160) : ''
  const search = searchRaw || undefined

  const rawAvail = typeof q.avail === 'string' ? q.avail.trim() : ''
  const availability =
    rawAvail === 'bookable' || rawAvail === 'offline' ? rawAvail : 'all'

  const rawFeat = typeof q.feat === 'string' ? q.feat.trim() : ''
  const featured = rawFeat === 'yes' || rawFeat === 'no' ? rawFeat : 'all'

  const rawView = typeof q.view === 'string' ? q.view.trim() : ''
  const view: 'grid' | 'list' = rawView === 'list' ? 'list' : 'grid'

  const page = Math.max(1, parseIntSafe(q.page, 1))
  const perRaw = parseIntSafe(q.per, 12)
  const pageSize = PAGE_SIZE_OPTIONS.includes(perRaw as (typeof PAGE_SIZE_OPTIONS)[number]) ? perRaw : 12

  let pageResult: Awaited<ReturnType<typeof adminListVehiclesPage>> = {
    rows: [],
    totalCount: 0,
    page: 1,
    pageSize: 12,
  }
  let metrics: Awaited<ReturnType<typeof adminGetFleetDashboardMetrics>> = {
    totalVehicles: 0,
    availableVehicles: 0,
    featuredVehicles: 0,
    avgPricePerDay: null,
    vehiclesOnTripToday: 0,
    bookableUtilizationPercent: 0,
  }
  let loadError: string | null = null

  try {
    pageResult = await adminListVehiclesPage({
      page,
      pageSize,
      search,
      availability,
      featured,
    })
  } catch (e) {
    console.error('[AdminFleetPage] list', e)
    loadError = 'Unable to load the fleet catalog. Check your Supabase connection and try again.'
  }

  try {
    metrics = await adminGetFleetDashboardMetrics()
  } catch (e) {
    console.error('[AdminFleetPage] metrics', e)
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Fleet"
        title="Fleet studio"
        description="Glass command center for catalog vehicles — utilization, pricing, availability, and media in one responsive surface."
      />

      <AdminFleetManager
        pageResult={pageResult}
        listQuery={{
          q: searchRaw,
          avail: availability,
          feat: featured,
          view,
          page: pageResult.page,
          pageSize: pageResult.pageSize,
        }}
        metrics={metrics}
        initialOpenAdd={initialOpenAdd}
        loadError={loadError}
      />
    </div>
  )
}
