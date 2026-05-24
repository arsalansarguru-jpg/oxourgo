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

export async function adminReplySupportConversationAction(
  conversationId: string,
  body: string,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminReplySupportConversationAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('support.write')
    if (!guard.ok) return guard

    const text = body.trim()
    if (!text) return { ok: false, message: 'Reply cannot be empty.' }

    const admin = createAdminClient()
    const now = new Date().toISOString()

    const { error: msgErr } = await admin.from('support_messages').insert({
      conversation_id: conversationId,
      sender_role: 'staff',
      body: text,
    })
    if (msgErr) return adminActionDbFailed('adminReplySupportConversationAction', msgErr)

    const { error: convErr } = await admin
      .from('support_conversations')
      .update({ status: 'in_progress', last_message_at: now, updated_at: now })
      .eq('id', conversationId)
    if (convErr) return adminActionDbFailed('adminReplySupportConversationAction:conv', convErr)

    revalidatePath('/admin/support')
    return { ok: true }
  })
}

export async function adminCreateSupportTicketAction(input: {
  userId?: string | null
  bookingId?: string | null
  subject: string
  body: string
  category: string
  priority: string
}): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminCreateSupportTicketAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('support.write')
    if (!guard.ok) return guard

    const subject = input.subject.trim()
    const body = input.body.trim()
    if (!subject || !body) {
      return { ok: false, message: 'Subject and body are required.' }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('support_tickets').insert({
      user_id: input.userId || null,
      booking_id: input.bookingId || null,
      subject,
      body,
      category: input.category,
      priority: input.priority,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) return adminActionDbFailed('adminCreateSupportTicketAction', error)

    revalidatePath('/admin/support')
    return { ok: true }
  })
}
