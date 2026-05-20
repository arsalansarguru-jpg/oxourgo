'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { requirePermissionForAdminAction } from '@/lib/auth/admin-action-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'
import { adminActionDbFailed } from '@/lib/errors/safe-user-message'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'

export type SupportTicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed'

export async function updateSupportTicketStatusAction(
  ticketId: string,
  status: SupportTicketStatus,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('updateSupportTicketStatusAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('support.write')
    if (!guard.ok) return guard

    const admin = createAdminClient()
    const patch: Database['public']['Tables']['support_tickets']['Update'] = {
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'resolved' || status === 'closed'
        ? { resolved_at: new Date().toISOString() }
        : {}),
    }

    const { error } = await admin.from('support_tickets').update(patch).eq('id', ticketId)

    if (error) return adminActionDbFailed('updateSupportTicketStatusAction', error)

    revalidatePath('/admin/support')
    return { ok: true }
  })
}
