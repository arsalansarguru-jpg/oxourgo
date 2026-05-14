import { AdminFleetManager } from '@/components/admin/fleet/admin-fleet-manager'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { adminGetFleetDashboardMetrics, adminListVehicles } from '@/lib/admin/data/fleet'

export const dynamic = 'force-dynamic'

export default async function AdminFleetPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>
}) {
  const q = await searchParams
  const initialOpenAdd = q.add === '1'

  let vehicles: Awaited<ReturnType<typeof adminListVehicles>> = []
  let metrics: Awaited<ReturnType<typeof adminGetFleetDashboardMetrics>> = {
    totalVehicles: 0,
    availableVehicles: 0,
    featuredVehicles: 0,
    avgPricePerDay: null,
    vehiclesOnTripToday: 0,
    bookableUtilizationPercent: 0,
  }

  try {
    vehicles = await adminListVehicles()
    metrics = await adminGetFleetDashboardMetrics()
  } catch {
    vehicles = []
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Fleet"
        title="Fleet studio"
        description="Glass command center for catalog vehicles — utilization, pricing, availability, and media in one responsive surface."
      />

      <AdminFleetManager vehicles={vehicles} metrics={metrics} initialOpenAdd={initialOpenAdd} />
    </div>
  )
}
