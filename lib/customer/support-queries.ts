import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { SupportMessageRow } from '@/lib/support/types'

type DbMessage = {
  id: string
  conversation_id: string
  sender_role: string
  body: string
  created_at: string
}

function mapMessage(row: DbMessage): SupportMessageRow {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderRole: row.sender_role as SupportMessageRow['senderRole'],
    body: row.body,
    createdAt: row.created_at,
  }
}

export async function listCustomerSupportMessages(userId: string, limit = 80): Promise<SupportMessageRow[]> {
  const supabase = await createClient()

  const { data: conv } = await supabase
    .from('support_conversations')
    .select('id')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!conv?.id) return []

  const { data, error } = await supabase
    .from('support_messages')
    .select('id, conversation_id, sender_role, body, created_at')
    .eq('conversation_id', conv.id)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[listCustomerSupportMessages]', error.message)
    return []
  }

  return (data ?? []).map((r) => mapMessage(r as DbMessage))
}
