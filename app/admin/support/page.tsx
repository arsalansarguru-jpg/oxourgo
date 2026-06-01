import { AdminSupportDashboard } from '@/components/admin/support/admin-support-dashboard'
import { getCachedAdminCustomers, getCachedAdminSupportBundle } from '@/lib/admin/cached-data'
import type { AdminCustomerRow } from '@/lib/admin/data/customers'
import type { AdminSupportConversationItem } from '@/lib/admin/data/support-conversations'
import type { SupportTicketRow } from '@/lib/admin/data/support-tickets'
import { adminPageMetadata } from '@/lib/admin/page-metadata'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export const metadata = adminPageMetadata('Support Tickets')

export default async function AdminSupportPage() {
  await requireAdminPageAccess('/admin/support')

  let metrics = { open: 0, inProgress: 0, urgent: 0, resolvedToday: 0 }
  let tickets: SupportTicketRow[] = []
  let conversations: AdminSupportConversationItem[] = []
  let customers: AdminCustomerRow[] = []

  try {
    const bundle = await getCachedAdminSupportBundle()
    metrics = bundle.metrics
    tickets = bundle.tickets
    conversations = bundle.conversations
    customers = await getCachedAdminCustomers()
  } catch {
    /* safe empty */
  }

  return <AdminSupportDashboard metrics={metrics} tickets={tickets} conversations={conversations} customers={customers} />
}
