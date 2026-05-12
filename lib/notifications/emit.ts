import 'server-only'

import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

import type { NotificationTypeId } from '@/lib/notifications/types'

/**
 * Inserts a customer notification using the service role after auth has been validated upstream.
 */
export async function notifyCustomer(input: {
  userId: string
  type: NotificationTypeId
  title: string
  body?: string | null
  metadata?: Json
}): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('notifications').insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      metadata: (input.metadata ?? {}) as Json,
    })
    if (error) {
      console.error('[notifyCustomer]', error.message)
    }
  } catch (e) {
    console.error('[notifyCustomer]', e)
  }
}

/**
 * Inserts an operations alert (read in admin console via service role).
 */
export async function notifyOps(input: {
  type: string
  title: string
  body?: string | null
  metadata?: Json
}): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('ops_alerts').insert({
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      metadata: (input.metadata ?? {}) as Json,
    })
    if (error) {
      console.error('[notifyOps]', error.message)
    }
  } catch (e) {
    console.error('[notifyOps]', e)
  }
}
