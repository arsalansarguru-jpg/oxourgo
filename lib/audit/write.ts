import 'server-only'

import { captureServerPosthogEvent } from '@/lib/analytics/posthog-server'
import { POSTHOG_EVENTS } from '@/lib/analytics/posthog-events'
import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

export type WriteAuditLogInput = {
  actorId?: string | null
  actorRole?: string | null
  entityType: string
  entityId?: string | null
  action: string
  oldValue?: Json | null
  newValue?: Json | null
  metadata?: Json | null
}

/**
 * Append an immutable row to `audit_logs`. Non-blocking — failures are swallowed.
 */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('audit_logs').insert({
      actor_id: input.actorId ?? null,
      actor_role: input.actorRole ?? null,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      action: input.action,
      old_value: input.oldValue ?? null,
      new_value: input.newValue ?? null,
      metadata: input.metadata ?? null,
    })

    if (!error && input.actorId) {
      void captureServerPosthogEvent({
        distinctId: input.actorId,
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
