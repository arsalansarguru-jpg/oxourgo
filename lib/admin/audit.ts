import 'server-only'

import { captureServerPosthogEvent } from '@/lib/analytics/posthog-server'
import { POSTHOG_EVENTS } from '@/lib/analytics/posthog-events'

import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

export async function writeAdminAudit(input: {
  actorUserId: string
  action: string
  entityType: string
  entityId?: string | null
  payload?: Json
}): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('admin_audit_events').insert({
      actor_user_id: input.actorUserId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      payload: input.payload ?? null,
    })
    if (!error) {
      void captureServerPosthogEvent({
        distinctId: input.actorUserId,
        event: POSTHOG_EVENTS.adminAction,
        properties: {
          audit_action: input.action,
          entity_type: input.entityType,
          ...(input.entityId ? { entity_id: input.entityId } : {}),
        },
      })
    }
  } catch {
    // Non-blocking: audit failures must not break primary operations.
  }
}
