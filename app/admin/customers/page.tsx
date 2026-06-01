import { AdminCustomersDirectory } from '@/components/admin/customers/admin-customers-directory'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { getCachedAdminCustomers } from '@/lib/admin/cached-data'
import type { AdminCustomerRow } from '@/lib/admin/data/customers'
import { adminPageMetadata } from '@/lib/admin/page-metadata'

export const dynamic = 'force-dynamic'

export const metadata = adminPageMetadata('Customers')

export default async function AdminCustomersPage() {
  let rows: AdminCustomerRow[] = []
  try {
    rows = await getCachedAdminCustomers()
  } catch {
    rows = []
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Customers"
        title="Directory"
        description="Auth-backed directory with profile tier, heuristic risk from cancellations, and admin-editable fields."
      />

      <AdminCustomersDirectory rows={rows} />
    </div>
  )
}
