import { AdminDashboardHome } from '@/components/admin/dashboard/admin-dashboard-home'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

export default function AdminHomePage() {
  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHeader
        title="Dashboard"
        description="Executive view of revenue, fleet load, reservations, and compliance — sample data until live analytics connect."
      />
      <AdminDashboardHome />
    </div>
  )
}
