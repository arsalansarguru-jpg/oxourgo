import { AdminBackupDashboard } from '@/components/admin/backup/admin-backup-dashboard'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { adminListArchivedVehiclesAction } from '@/lib/admin/actions/recovery-actions'
import { fetchBackupHealthBundle, type BackupHealthBundle } from '@/lib/admin/data/backup-health'
import { getAuthSessionSummary } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export default async function AdminBackupPage() {
  const summary = await getAuthSessionSummary()
  const role = summary?.appRole ?? 'support_agent'

  let health: BackupHealthBundle = {
    indicators: [],
    archivedCounts: { vehicles: 0, violations: 0, kycDocuments: 0, bookings: 0 },
    recentOperations: [],
    checkedAt: new Date().toISOString(),
  }
  let archivedVehicles: { id: string; name: string; brand: string; archivedAt: string | null }[] = []

  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    try {
      health = await fetchBackupHealthBundle()
      const archived = await adminListArchivedVehiclesAction()
      if (archived.ok && archived.rows) archivedVehicles = archived.rows
    } catch {
      /* graceful defaults */
    }
  }

  const canExport = hasPermission(role, 'admin.exports.read')
  const canRestore = hasPermission(role, 'admin.recovery.write')

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHeader
        eyebrow="Resilience"
        title="Backup & recovery"
        description="Export operational data, monitor database health, and restore archived fleet records — without permanent deletes."
      />
      <AdminBackupDashboard
        health={health}
        archivedVehicles={archivedVehicles}
        canExport={canExport}
        canRestore={canRestore}
        exportPermissions={{
          bookings: hasPermission(role, 'bookings.read'),
          payments: hasPermission(role, 'payments.read'),
          fleet: hasPermission(role, 'fleet.read'),
          penalties: hasPermission(role, 'penalties.read'),
          kyc: hasPermission(role, 'kyc.read'),
        }}
      />
    </div>
  )
}
