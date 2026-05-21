import 'server-only'

import { writeAuditLog, type WriteAuditLogInput } from '@/lib/audit/write'
import { logPostgrestError } from '@/lib/errors/safe-user-message'
import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'

export type WriteAdminAuditInput = {
  actorUserId: string
  actorRole?: string | null
  action: string
  entityType: string
  entityId?: string | null
  oldValue?: Json | null
  newValue?: Json | null
  metadata?: Json | null
  /** @deprecated Use metadata — kept for existing callers */
  payload?: Json
}

/**
 * Records an admin action in `audit_logs` (canonical) and `admin_audit_events` (legacy feed).
 * Non-blocking for callers — insert failures are logged via writeAuditLog.
 */
export async function writeAdminAudit(input: WriteAdminAuditInput): Promise<void> {
  const metadata = input.metadata ?? input.payload ?? null

  const auditInput: WriteAuditLogInput = {
    actorId: input.actorUserId,
    actorRole: input.actorRole ?? null,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    oldValue: input.oldValue,
    newValue: input.newValue,
    metadata,
  }

  await writeAuditLog(auditInput)

  try {
    const admin = createAdminClient()
    const { error: legacyErr } = await admin.from('admin_audit_events').insert({
      actor_user_id: input.actorUserId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      payload: metadata,
    })
    if (legacyErr) logPostgrestError('[writeAdminAudit] admin_audit_events', legacyErr)
  } catch (err) {
    console.error('[writeAdminAudit] legacy feed', err)
  }
}
