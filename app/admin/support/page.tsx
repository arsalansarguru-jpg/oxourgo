import { AdminSupportDashboard } from '@/components/admin/support/admin-support-dashboard'
import { adminListSupportConversations } from '@/lib/admin/data/support-conversations'
import { adminListSupportTickets, adminSupportTicketMetrics } from '@/lib/admin/data/support-tickets'
import { adminListCustomers } from '@/lib/admin/data/customers'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function AdminSupportPage() {
  await requireAdminPageAccess('/admin/support')

  let metrics = { open: 0, inProgress: 0, urgent: 0, resolvedToday: 0 }
  let tickets: Awaited<ReturnType<typeof adminListSupportTickets>> = []
  let conversations: Awaited<ReturnType<typeof adminListSupportConversations>> = []
  let customers: Awaited<ReturnType<typeof adminListCustomers>> = []

  try {
    ;[metrics, tickets, conversations, customers] = await Promise.all([
      adminSupportTicketMetrics(),
      adminListSupportTickets(),
      adminListSupportConversations(),
      adminListCustomers(),
    ])
  } catch {
    /* safe empty */
  }

  return <AdminSupportDashboard metrics={metrics} tickets={tickets} conversations={conversations} customers={customers} />
}
