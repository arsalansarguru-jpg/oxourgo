import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type BackupHealthIndicator = {
  id: string
  label: string
  status: 'healthy' | 'warn' | 'critical' | 'unknown'
  value: string
  detail?: string
}

export type BackupHealthBundle = {
  indicators: BackupHealthIndicator[]
  archivedCounts: {
    vehicles: number
    violations: number
    kycDocuments: number
    bookings: number
  }
  recentOperations: BackupOperationRow[]
  checkedAt: string
}

export type BackupOperationRow = {
  id: string
  operationType: string
  status: string
  summary: string | null
  createdAt: string
}

async function countWhere(
  table: 'vehicles' | 'booking_violations' | 'kyc_documents' | 'bookings',
  column: 'deleted_at',
  notNull: boolean,
): Promise<number> {
  const admin = createAdminClient()
  let q = admin.from(table).select('id', { count: 'exact', head: true })
  q = notNull ? q.not(column, 'is', null) : q.is(column, null)
  const { count, error } = await q
  if (error) {
    logPostgrestError(`[backupHealth] ${table}`, error)
    return 0
  }
  return count ?? 0
}

export async function fetchBackupHealthBundle(): Promise<BackupHealthBundle> {
  const admin = createAdminClient()
  const checkedAt = new Date().toISOString()

  const [
    vehiclesActive,
    vehiclesArchived,
    violationsArchived,
    kycArchived,
    bookingsArchived,
    bookingsTotal,
    auditRecent,
    kycPinned,
    opsRes,
  ] = await Promise.all([
    countWhere('vehicles', 'deleted_at', false),
    countWhere('vehicles', 'deleted_at', true),
    countWhere('booking_violations', 'deleted_at', true),
    countWhere('kyc_documents', 'deleted_at', true),
    countWhere('bookings', 'deleted_at', true),
    admin.from('bookings').select('id', { count: 'exact', head: true }),
    admin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    admin
      .from('kyc_documents')
      .select('id', { count: 'exact', head: true })
      .eq('storage_pinned', true)
      .is('deleted_at', null),
    admin
      .from('backup_operation_logs')
      .select('id, operation_type, status, summary, created_at')
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  if (bookingsTotal.error) logPostgrestError('[backupHealth] bookings', bookingsTotal.error)
  if (auditRecent.error) logPostgrestError('[backupHealth] audit', auditRecent.error)
  if (kycPinned.error) logPostgrestError('[backupHealth] kycPinned', kycPinned.error)
  if (opsRes.error) logPostgrestError('[backupHealth] ops log', opsRes.error)

  const totalBookings = bookingsTotal.count ?? 0
  const audit24h = auditRecent.count ?? 0
  const pinnedKyc = kycPinned.count ?? 0

  const indicators: BackupHealthIndicator[] = [
    {
      id: 'fleet-active',
      label: 'Active fleet vehicles',
      status: vehiclesActive > 0 ? 'healthy' : 'warn',
      value: String(vehiclesActive),
      detail: 'Non-archived catalog vehicles',
    },
    {
      id: 'bookings-total',
      label: 'Booking records',
      status: 'healthy',
      value: String(totalBookings),
      detail: 'All statuses including cancelled',
    },
    {
      id: 'audit-24h',
      label: 'Audit events (24h)',
      status: audit24h > 0 ? 'healthy' : 'warn',
      value: String(audit24h),
      detail: 'Immutable activity trail',
    },
    {
      id: 'kyc-pinned',
      label: 'KYC docs protected',
      status: 'healthy',
      value: String(pinnedKyc),
      detail: 'Storage-pinned documents',
    },
    {
      id: 'archived-fleet',
      label: 'Archived vehicles',
      status: vehiclesArchived > 5 ? 'warn' : 'healthy',
      value: String(vehiclesArchived),
      detail: 'Recoverable from backup tools',
    },
  ]

  const recentOperations: BackupOperationRow[] = (opsRes.data ?? []).map((r) => ({
    id: r.id,
    operationType: r.operation_type,
    status: r.status,
    summary: r.summary,
    createdAt: r.created_at,
  }))

  return {
    indicators,
    archivedCounts: {
      vehicles: vehiclesArchived,
      violations: violationsArchived,
      kycDocuments: kycArchived,
      bookings: bookingsArchived,
    },
    recentOperations,
    checkedAt,
  }
}

export async function logBackupOperation(input: {
  operationType: string
  status?: string
  summary?: string
  performedBy?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('backup_operation_logs').insert({
    operation_type: input.operationType,
    status: input.status ?? 'completed',
    summary: input.summary ?? null,
    performed_by: input.performedBy ?? null,
    metadata: (input.metadata ?? {}) as import('@/lib/supabase/database.types').Json,
  })
  if (error) logPostgrestError('[logBackupOperation]', error)
}
