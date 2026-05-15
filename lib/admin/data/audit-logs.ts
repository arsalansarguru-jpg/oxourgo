import 'server-only'

import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type AuditLogRow = {
  id: string
  actorId: string | null
  actorRole: string | null
  entityType: string
  entityId: string | null
  action: string
  oldValue: Json | null
  newValue: Json | null
  metadata: Json | null
  createdAt: string
}

export type AuditLogFilters = {
  action?: string
  actorId?: string
  entityType?: string
  entityId?: string
  from?: string
  to?: string
  limit?: number
}

function mapRow(row: {
  id: string
  actor_id: string | null
  actor_role: string | null
  entity_type: string
  entity_id: string | null
  action: string
  old_value: Json | null
  new_value: Json | null
  metadata: Json | null
  created_at: string
}): AuditLogRow {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    oldValue: row.old_value,
    newValue: row.new_value,
    metadata: row.metadata,
    createdAt: row.created_at,
  }
}

export async function listAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogRow[]> {
  const admin = createAdminClient()
  const limit = Math.min(filters.limit ?? 50, 200)

  let query = admin
    .from('audit_logs')
    .select('id, actor_id, actor_role, entity_type, entity_id, action, old_value, new_value, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.action) query = query.eq('action', filters.action)
  if (filters.actorId) query = query.eq('actor_id', filters.actorId)
  if (filters.entityType) query = query.eq('entity_type', filters.entityType)
  if (filters.entityId) query = query.eq('entity_id', filters.entityId)
  if (filters.from) query = query.gte('created_at', filters.from)
  if (filters.to) query = query.lte('created_at', filters.to)

  const { data, error } = await query
  if (error) {
    logPostgrestError('[listAuditLogs]', error)
    return []
  }
  return (data ?? []).map(mapRow)
}

export async function listAuditLogsForBooking(bookingId: string, limit = 60): Promise<AuditLogRow[]> {
  const admin = createAdminClient()

  const [byEntity, byMeta] = await Promise.all([
    admin
      .from('audit_logs')
      .select('id, actor_id, actor_role, entity_type, entity_id, action, old_value, new_value, metadata, created_at')
      .eq('entity_type', 'booking')
      .eq('entity_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(limit),
    admin
      .from('audit_logs')
      .select('id, actor_id, actor_role, entity_type, entity_id, action, old_value, new_value, metadata, created_at')
      .filter('metadata->>bookingId', 'eq', bookingId)
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  if (byEntity.error) logPostgrestError('[listAuditLogsForBooking:entity]', byEntity.error)
  if (byMeta.error) logPostgrestError('[listAuditLogsForBooking:meta]', byMeta.error)

  const merged = new Map<string, AuditLogRow>()
  for (const row of [...(byEntity.data ?? []), ...(byMeta.data ?? [])]) {
    merged.set(row.id, mapRow(row))
  }
  return [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit)
}

export async function listAuditLogsForUser(userId: string, limit = 60): Promise<AuditLogRow[]> {
  const admin = createAdminClient()

  const [byProfile, byMeta] = await Promise.all([
    admin
      .from('audit_logs')
      .select('id, actor_id, actor_role, entity_type, entity_id, action, old_value, new_value, metadata, created_at')
      .eq('entity_type', 'profile')
      .eq('entity_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
    admin
      .from('audit_logs')
      .select('id, actor_id, actor_role, entity_type, entity_id, action, old_value, new_value, metadata, created_at')
      .filter('metadata->>userId', 'eq', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  if (byProfile.error) logPostgrestError('[listAuditLogsForUser:profile]', byProfile.error)
  if (byMeta.error) logPostgrestError('[listAuditLogsForUser:meta]', byMeta.error)

  const merged = new Map<string, AuditLogRow>()
  for (const row of [...(byProfile.data ?? []), ...(byMeta.data ?? [])]) {
    merged.set(row.id, mapRow(row))
  }
  return [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit)
}

export async function listPaymentAuditLogs(limit = 40): Promise<AuditLogRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('audit_logs')
    .select('id, actor_id, actor_role, entity_type, entity_id, action, old_value, new_value, metadata, created_at')
    .or(
      'action.eq.payment.received,action.eq.payment.refund,action.eq.deposit.received,action.eq.deposit.released,action.eq.deposit.deducted,action.eq.penalty.added,action.eq.deduction.applied',
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logPostgrestError('[listPaymentAuditLogs]', error)
    return []
  }
  return (data ?? []).map(mapRow)
}

export async function listDistinctAuditActions(limit = 80): Promise<string[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('audit_logs').select('action').order('action').limit(500)
  if (error) {
    logPostgrestError('[listDistinctAuditActions]', error)
    return []
  }
  const set = new Set<string>()
  for (const row of data ?? []) {
    if (row.action) set.add(row.action)
    if (set.size >= limit) break
  }
  return [...set].sort()
}
