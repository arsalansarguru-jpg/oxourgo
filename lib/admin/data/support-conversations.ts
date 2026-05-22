import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'
import { resolveCustomerDisplayName } from '@/lib/customer/display-name'

export type AdminSupportConversationItem = {
  id: string
  userId: string
  customerLabel: string
  status: string
  lastMessageAt: string
  lastMessagePreview: string | null
}

export async function adminListSupportConversations(limit = 50): Promise<AdminSupportConversationItem[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('support_conversations')
    .select('id, user_id, status, last_message_at')
    .order('last_message_at', { ascending: false })
    .limit(limit)

  if (error) {
    logPostgrestError('[adminListSupportConversations]', error)
    return []
  }

  const rows = data ?? []
  const out: AdminSupportConversationItem[] = []

  for (const c of rows) {
    const userId = c.user_id as string
    let customerLabel = `Customer ${userId.slice(0, 8).toUpperCase()}`
    let lastPreview: string | null = null

    const { data: prof } = await admin.from('profiles').select('full_name, display_name, phone').eq('user_id', userId).maybeSingle()
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(userId)
      const raw = authUser?.user?.user_metadata
      customerLabel = resolveCustomerDisplayName({
        userId,
        fullName: (prof?.full_name as string | null) ?? (prof?.display_name as string | null) ?? null,
        email: authUser?.user?.email ?? null,
        phone: (prof?.phone as string | null) ?? null,
        authMetadata:
          raw && typeof raw === 'object'
            ? {
                full_name: typeof raw.full_name === 'string' ? raw.full_name : undefined,
                name: typeof raw.name === 'string' ? raw.name : undefined,
                display_name: typeof raw.display_name === 'string' ? raw.display_name : undefined,
              }
            : null,
      })
    } catch {
      if (prof?.full_name) customerLabel = String(prof.full_name)
    }

    const { data: lastMsg } = await admin
      .from('support_messages')
      .select('body')
      .eq('conversation_id', c.id as string)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (lastMsg?.body) lastPreview = String(lastMsg.body).trim().slice(0, 120)

    out.push({
      id: c.id as string,
      userId,
      customerLabel,
      status: (c.status as string) ?? 'open',
      lastMessageAt: c.last_message_at as string,
      lastMessagePreview: lastPreview,
    })
  }

  return out
}
