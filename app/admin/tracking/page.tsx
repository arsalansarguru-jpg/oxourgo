import { AdminTrackingDashboard } from '@/components/admin/tracking/admin-tracking-dashboard'
import { adminListVehicleTracking, adminVehicleComplianceAlerts } from '@/lib/admin/data/tracking'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function AdminTrackingPage() {
  await requireAdminPageAccess('/admin/tracking')

  let vehicles: Awaited<ReturnType<typeof adminListVehicleTracking>> = []
  let alerts: Awaited<ReturnType<typeof adminVehicleComplianceAlerts>> = []

  try {
    ;[vehicles, alerts] = await Promise.all([adminListVehicleTracking(), adminVehicleComplianceAlerts()])
  } catch {
    /* safe empty */
  }

  return <AdminTrackingDashboard vehicles={vehicles} alerts={alerts} />
}
