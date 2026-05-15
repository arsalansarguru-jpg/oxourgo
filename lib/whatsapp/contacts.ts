import 'server-only'

import { normalizeToE164 } from '@/lib/whatsapp/e164'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'
import type { Database } from '@/lib/supabase/database.types'

export type CustomerContactRow = Database['public']['Tables']['customer_contacts']['Row']

/** Upsert contact by E.164; optionally link to auth user. */
export async function upsertCustomerContactByPhone(input: {
  phone: string
  fullName?: string | null
  email?: string | null
  userId?: string | null
}): Promise<{ contact: CustomerContactRow | null; error: string | null }> {
  const e164 = normalizeToE164(input.phone)
  if (!e164) {
    return { contact: null, error: 'Invalid phone number.' }
  }

  const admin = createAdminClient()
  const { data: existing, error: findErr } = await admin
    .from('customer_contacts')
    .select('*')
    .eq('e164', e164)
    .maybeSingle()

  if (findErr) {
    logPostgrestError('[upsertCustomerContactByPhone] find', findErr)
    return { contact: null, error: 'Could not resolve contact.' }
  }

  if (existing) {
    const patch: Database['public']['Tables']['customer_contacts']['Update'] = {}
    if (input.fullName?.trim()) patch.full_name = input.fullName.trim()
    if (input.email?.trim()) patch.email = input.email.trim()
    if (input.userId) patch.user_id = input.userId

    if (Object.keys(patch).length === 0) {
      return { contact: existing, error: null }
    }

    const { data: updated, error: updErr } = await admin
      .from('customer_contacts')
      .update(patch)
      .eq('id', existing.id)
      .select('*')
      .single()

    if (updErr) {
      logPostgrestError('[upsertCustomerContactByPhone] update', updErr)
      return { contact: null, error: 'Could not update contact.' }
    }
    return { contact: updated, error: null }
  }

  const insert: Database['public']['Tables']['customer_contacts']['Insert'] = {
    e164,
    full_name: input.fullName?.trim() || null,
    email: input.email?.trim() || null,
    user_id: input.userId ?? null,
    preferred_channel: 'whatsapp',
  }

  const { data: created, error: insErr } = await admin.from('customer_contacts').insert(insert).select('*').single()

  if (insErr) {
    logPostgrestError('[upsertCustomerContactByPhone] insert', insErr)
    return { contact: null, error: 'Could not create contact.' }
  }
  return { contact: created, error: null }
}

export async function linkCustomerContactToUser(
  contactId: string,
  userId: string,
): Promise<{ ok: boolean; message: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('customer_contacts').update({ user_id: userId }).eq('id', contactId)

  if (error) {
    logPostgrestError('[linkCustomerContactToUser]', error)
    return { ok: false, message: 'Could not link contact to account.' }
  }
  return { ok: true, message: 'Contact linked.' }
}

export async function getCustomerContactByE164(e164: string): Promise<CustomerContactRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('customer_contacts').select('*').eq('e164', e164).maybeSingle()
  if (error) logPostgrestError('[getCustomerContactByE164]', error)
  return data ?? null
}
