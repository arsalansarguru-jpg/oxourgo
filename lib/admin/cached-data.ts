import 'server-only'

import { unstable_cache } from 'next/cache'

import { adminListBookingsPage, type AdminBookingsListParams } from '@/lib/admin/data/bookings'
import { adminListCustomers } from '@/lib/admin/data/customers'
import { adminListSupportTickets, adminSupportTicketMetrics } from '@/lib/admin/data/support-tickets'
import { adminListSupportConversations } from '@/lib/admin/data/support-conversations'

const REVALIDATE_SEC = 30

export const getCachedAdminCustomers = unstable_cache(
  async () => adminListCustomers(),
  ['admin-customers-directory'],
  { revalidate: REVALIDATE_SEC },
)

export const getCachedAdminBookingsPage = unstable_cache(
  async (key: string) => {
    const params = JSON.parse(key) as AdminBookingsListParams
    return adminListBookingsPage(params)
  },
  ['admin-bookings-page'],
  { revalidate: REVALIDATE_SEC },
)

export const getCachedAdminSupportBundle = unstable_cache(
  async () => {
    const [metrics, tickets, conversations] = await Promise.all([
      adminSupportTicketMetrics(),
      adminListSupportTickets(),
      adminListSupportConversations(),
    ])
    return { metrics, tickets, conversations }
  },
  ['admin-support-bundle'],
  { revalidate: REVALIDATE_SEC },
)
