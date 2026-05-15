'use server'

import { revalidatePath } from 'next/cache'

import { restoreSoftDeletedRecord, softDeleteRecord } from '@/lib/admin/soft-delete'
import { writeAdminAudit } from '@/lib/admin/audit'
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@/lib/audit/actions'
import { logBackupOperation } from '@/lib/admin/data/backup-health'
import { requirePermissionForAdminAction } from '@/lib/auth/admin-action-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'
import type { AdminActionResult } from '@/lib/admin/actions/types'

export async function adminArchiveVehicleAction(vehicleId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminArchiveVehicleAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('fleet.delete')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()

    const { data: row, error } = await admin.from('vehicles').select('*').eq('id', vehicleId).maybeSingle()
    if (error || !row) return { ok: false, message: 'Vehicle not found.' }

    const result = await softDeleteRecord({
      table: 'vehicles',
      id: vehicleId,
      actorUserId: user.id,
      snapshot: row as Record<string, unknown>,
      entityType: AUDIT_ENTITY_TYPES.vehicle,
    })

    if (!result.ok) return result

    await writeAdminAudit({
      actorUserId: user.id,
      action: AUDIT_ACTIONS.fleetArchived,
      entityType: AUDIT_ENTITY_TYPES.vehicle,
      entityId: vehicleId,
    })

    await logBackupOperation({
      operationType: 'archive',
      summary: `Vehicle ${vehicleId} archived`,
      performedBy: user.id,
    })

    revalidatePath('/admin/fleet')
    revalidatePath('/admin/backup')
    revalidatePath('/fleet')
    return { ok: true }
  })
}

export async function adminRestoreVehicleAction(vehicleId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminRestoreVehicleAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('admin.recovery.write')
    if (!guard.ok) return guard
    const { user } = guard.session

    const result = await restoreSoftDeletedRecord({
      table: 'vehicles',
      id: vehicleId,
      actorUserId: user.id,
      entityType: AUDIT_ENTITY_TYPES.vehicle,
    })

    if (!result.ok) return result

    await writeAdminAudit({
      actorUserId: user.id,
      action: AUDIT_ACTIONS.fleetRestored,
      entityType: AUDIT_ENTITY_TYPES.vehicle,
      entityId: vehicleId,
    })

    await logBackupOperation({
      operationType: 'restore',
      summary: `Vehicle ${vehicleId} restored`,
      performedBy: user.id,
    })

    revalidatePath('/admin/fleet')
    revalidatePath('/admin/backup')
    revalidatePath('/fleet')
    return { ok: true }
  })
}

export async function adminRestoreViolationAction(violationId: string): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminRestoreViolationAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('admin.recovery.write')
    if (!guard.ok) return guard
    const { user } = guard.session

    const result = await restoreSoftDeletedRecord({
      table: 'booking_violations',
      id: violationId,
      actorUserId: user.id,
      entityType: AUDIT_ENTITY_TYPES.violation,
    })

    if (!result.ok) return result

    await writeAdminAudit({
      actorUserId: user.id,
      action: AUDIT_ACTIONS.violationRestored,
      entityType: AUDIT_ENTITY_TYPES.violation,
      entityId: violationId,
    })

    revalidatePath('/admin/violations')
    revalidatePath('/admin/backup')
    return { ok: true }
  })
}

export async function adminListArchivedVehiclesAction(): Promise<{
  ok: boolean
  rows?: { id: string; name: string; brand: string; archivedAt: string | null }[]
  message?: string
}> {
  return runInstrumentedServerAction('adminListArchivedVehiclesAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('admin.backup.read')
    if (!guard.ok) return { ok: false, message: guard.message }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('vehicles')
      .select('id, name, brand, archived_at')
      .not('deleted_at', 'is', null)
      .order('archived_at', { ascending: false })
      .limit(50)

    if (error) return { ok: false, message: 'Could not load archived vehicles.' }

    return {
      ok: true,
      rows: (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        brand: r.brand,
        archivedAt: (r as { archived_at?: string | null }).archived_at ?? null,
      })),
    }
  })
}
