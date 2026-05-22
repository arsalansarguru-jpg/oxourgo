'use server'

import { revalidatePath } from 'next/cache'

import { getAuthenticatedUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export type SupportActionResult = { ok: true } | { ok: false; message: string }

export async function sendCustomerSupportMessageAction(body: string): Promise<SupportActionResult> {
  const user = await getAuthenticatedUser()
  if (!user) return { ok: false, message: 'Sign in to message support.' }

  const text = body.trim()
  if (text.length < 2) return { ok: false, message: 'Enter a message.' }
  if (text.length > 4000) return { ok: false, message: 'Message is too long.' }

  const supabase = await createClient()
  const now = new Date().toISOString()

  let conversationId: string | null = null
  const { data: existing } = await supabase
    .from('support_conversations')
    .select('id')
    .eq('user_id', user.id)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    conversationId = existing.id
  } else {
    const { data: created, error: cErr } = await supabase
      .from('support_conversations')
      .insert({ user_id: user.id, status: 'open', last_message_at: now, updated_at: now })
      .select('id')
      .single()
    if (cErr || !created?.id) {
      console.error('[sendCustomerSupportMessageAction:create]', cErr?.message)
      return { ok: false, message: 'Could not start a support conversation. Try WhatsApp or email.' }
    }
    conversationId = created.id
  }

  if (!conversationId) return { ok: false, message: 'Could not start a support conversation.' }

  const { error: msgErr } = await supabase.from('support_messages').insert({
    conversation_id: conversationId,
    sender_role: 'customer',
    body: text,
  })

  if (msgErr) {
    console.error('[sendCustomerSupportMessageAction:message]', msgErr.message)
    return { ok: false, message: 'Could not send your message. Try again.' }
  }

  await supabase
    .from('support_conversations')
    .update({ last_message_at: now, updated_at: now, status: 'open' })
    .eq('id', conversationId)

  revalidatePath('/support')
  revalidatePath('/admin/support')
  return { ok: true }
}
