import 'server-only'

import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type ArchivableTable = 'vehicles' | 'cars' | 'booking_violations' | 'kyc_documents' | 'bookings'

export type SoftDeleteInput = {
  table: ArchivableTable
  id: string
  actorUserId: string
  snapshot: Record<string, unknown>
  entityType: string
}

const nowIso = () => new Date().toISOString()

/** Postgrest filter: active (non-deleted) rows only. */
export function activeRowsOnly<Q extends { is: (column: string, value: null) => Q }>(query: Q): Q {
  return query.is('deleted_at', null)
}

/** Apply soft-delete timestamps; never hard-deletes. */
export async function softDeleteRecord(input: SoftDeleteInput): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = createAdminClient()
  const ts = nowIso()

  const { data: existing, error: fetchErr } = await admin
    .from(input.table)
    .select('*')
    .eq('id', input.id)
    .maybeSingle()

  if (fetchErr) {
    logPostgrestError('[softDeleteRecord] fetch', fetchErr)
    return { ok: false, message: 'Could not verify record before archive.' }
  }
  if (!existing) return { ok: false, message: 'Record not found.' }

  const row = existing as Record<string, unknown>
  if (row.deleted_at) return { ok: false, message: 'Record is already archived.' }

  const snapshot = { ...input.snapshot, ...row }

  const { error: snapErr } = await admin.from('deleted_entity_snapshots').insert({
    entity_type: input.entityType,
    entity_id: input.id,
    snapshot: snapshot as Json,
    deleted_at: ts,
    deleted_by: input.actorUserId,
    metadata: { table: input.table },
  })

  if (snapErr) {
    logPostgrestError('[softDeleteRecord] snapshot', snapErr)
    return { ok: false, message: 'Archive snapshot failed. Record was not removed.' }
  }

  const archivePatch = {
    deleted_at: ts,
    archived_at: ts,
    archived_by: input.actorUserId,
  }

  const { error: updateErr } = await admin
    .from(input.table)
    .update(archivePatch as never)
    .eq('id', input.id)

  if (updateErr) {
    logPostgrestError('[softDeleteRecord] update', updateErr)
    return { ok: false, message: 'Could not archive record. Try again or contact support.' }
  }

  return { ok: true }
}

export async function restoreSoftDeletedRecord(input: {
  table: ArchivableTable
  id: string
  actorUserId: string
  entityType: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = createAdminClient()

  const { data: row, error: fetchErr } = await admin
    .from(input.table)
    .select('id, deleted_at')
    .eq('id', input.id)
    .maybeSingle()

  if (fetchErr) {
    if (fetchErr) logPostgrestError('[restoreSoftDeletedRecord] fetch', fetchErr)
    return { ok: false, message: 'Archived record not found.' }
  }
  if (!row) return { ok: false, message: 'Archived record not found.' }

  const deletedAt = (row as { deleted_at?: string | null }).deleted_at
  if (!deletedAt) return { ok: false, message: 'Record is not archived.' }

  const ts = nowIso()
  const restorePatch = { deleted_at: null, archived_at: null, archived_by: null }
  const { error: updateErr } = await admin
    .from(input.table)
    .update(restorePatch as never)
    .eq('id', input.id)

  if (updateErr) {
    logPostgrestError('[restoreSoftDeletedRecord] update', updateErr)
    return { ok: false, message: 'Restore failed. Please try again.' }
  }

  const { error: snapErr } = await admin
    .from('deleted_entity_snapshots')
    .update({ restored_at: ts, restored_by: input.actorUserId })
    .eq('entity_type', input.entityType)
    .eq('entity_id', input.id)
    .is('restored_at', null)

  if (snapErr) logPostgrestError('[restoreSoftDeletedRecord] snapshot mark', snapErr)

  return { ok: true }
}

/** @deprecated Use activeRowsOnly */
export const excludeSoftDeleted = activeRowsOnly
