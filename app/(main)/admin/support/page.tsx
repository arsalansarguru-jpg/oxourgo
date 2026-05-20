import { AdminSupportDashboard } from '@/components/admin/support/admin-support-dashboard'
import { adminListSupportTickets, adminSupportTicketMetrics } from '@/lib/admin/data/support-tickets'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function AdminSupportPage() {
  await requireAdminPageAccess('/admin/support')

  let metrics = { open: 0, inProgress: 0, urgent: 0, resolvedToday: 0 }
  let tickets: Awaited<ReturnType<typeof adminListSupportTickets>> = []

  try {
    ;[metrics, tickets] = await Promise.all([adminSupportTicketMetrics(), adminListSupportTickets()])
  } catch {
    /* safe empty */
  }

  return <AdminSupportDashboard metrics={metrics} tickets={tickets} />
}
