import { AdminOperationsDashboard } from '@/components/admin/operations/admin-operations-dashboard'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { adminLoadOperationsContext } from '@/lib/admin/data/operations'
import { canUseOpsOverride, hasPermission } from '@/lib/auth/permissions'
import { getAuthSessionSummary } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export default async function AdminOperationsPage() {
  const session = await getAuthSessionSummary()
  const role = session?.appRole ?? 'customer'

  let context: Awaited<ReturnType<typeof adminLoadOperationsContext>> = {
    stats: {
      bookingsOnHold: 0,
      manualBookings: 0,
      fleetMaintenance: 0,
      fleetAccidentHold: 0,
      fleetService: 0,
      vipBookings: 0,
    },
    audit: [],
    activity: [],
    vehicles: [],
  }

  try {
    context = await adminLoadOperationsContext()
  } catch {
    /* empty state */
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Operations"
        title="Manual control center"
        description="Create bookings, override lifecycle states, swap vehicles, and manage fleet emergencies — every action is audited."
      />
      <AdminOperationsDashboard
        stats={context.stats}
        audit={context.audit}
        activity={context.activity}
        vehicles={context.vehicles}
        canBypass={canUseOpsOverride(role)}
        canWrite={hasPermission(role, 'bookings.write')}
      />
    </div>
  )
}
