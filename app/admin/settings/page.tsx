import { AdminSettingsDashboard } from '@/components/admin/settings/admin-settings-dashboard'
import { requireAdminPageAccess } from '@/lib/auth/guards'
import { adminPageMetadata } from '@/lib/admin/page-metadata'
import { hasPermission } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export const metadata = adminPageMetadata('Settings')

export default async function AdminSettingsPage() {
  const summary = await requireAdminPageAccess('/admin/settings')

  return (
    <AdminSettingsDashboard
      email={summary.user.email}
      appRole={summary.appRole}
      canWrite={hasPermission(summary.appRole, 'settings.write')}
    />
  )
}
