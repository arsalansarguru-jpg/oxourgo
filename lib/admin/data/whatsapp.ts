import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'
export type AdminWhatsAppConversationListItem = {
  id: string
  flow_state: string
  status: string
  updated_at: string
  last_inbound_at: string | null
  active_booking_id: string | null
  contact: {
    id: string
    e164: string
    full_name: string | null
    user_id: string | null
  }
}

export async function adminListWhatsAppConversations(input?: {
  status?: string
  flowState?: string
  limit?: number
}): Promise<AdminWhatsAppConversationListItem[]> {
  const admin = createAdminClient()
  const limit = Math.min(Math.max(input?.limit ?? 50, 1), 100)

  let q = admin
    .from('whatsapp_conversations')
    .select(
      'id, flow_state, status, updated_at, last_inbound_at, active_booking_id, customer_contact_id',
    )
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (input?.status?.trim()) {
    q = q.eq('status', input.status.trim())
  }
  if (input?.flowState?.trim()) {
    q = q.eq('flow_state', input.flowState.trim())
  }

  const { data, error } = await q

  if (error) {
    logPostgrestError('[adminListWhatsAppConversations]', error)
    return []
  }

  const rows = data ?? []
  const contactIds = [...new Set(rows.map((row) => row.customer_contact_id).filter(Boolean))]

  const contactsById = new Map<
    string,
    { id: string; e164: string; full_name: string | null; user_id: string | null }
  >()

  if (contactIds.length > 0) {
    const { data: contacts, error: contactError } = await admin
      .from('customer_contacts')
      .select('id, e164, full_name, user_id')
      .in('id', contactIds)

    if (contactError) {
      logPostgrestError('[adminListWhatsAppConversations] contacts', contactError)
    } else {
      for (const contact of contacts ?? []) {
        contactsById.set(contact.id, contact)
      }
    }
  }

  return rows.map((row) => {
    const contact = contactsById.get(row.customer_contact_id)

    return {
      id: row.id,
      flow_state: row.flow_state,
      status: row.status,
      updated_at: row.updated_at,
      last_inbound_at: row.last_inbound_at,
      active_booking_id: row.active_booking_id,
      contact: {
        id: contact?.id ?? row.customer_contact_id,
        e164: contact?.e164 ?? '',
        full_name: contact?.full_name ?? null,
        user_id: contact?.user_id ?? null,
      },
    }
  })
}

export async function adminCountWhatsAppBookings(): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('booking_source', 'whatsapp')

  if (error) {
    logPostgrestError('[adminCountWhatsAppBookings]', error)
    return 0
  }
  return count ?? 0
}
