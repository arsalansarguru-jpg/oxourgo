'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { LAUNCH_CHECKLIST_ITEMS, LAUNCH_QA_TESTS } from '@/lib/admin/launch/checklist-definition'
import { requirePermissionForAdminAction } from '@/lib/auth/admin-action-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminActionDbFailed } from '@/lib/errors/safe-user-message'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'

const LAUNCH_PATH = '/admin/launch'

function isValidChecklistKey(key: string): boolean {
  return LAUNCH_CHECKLIST_ITEMS.some((i) => i.key === key)
}

function isValidQaKey(key: string): boolean {
  return LAUNCH_QA_TESTS.some((t) => t.key === key)
}

export async function toggleLaunchChecklistItemAction(
  itemKey: string,
  completed: boolean,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('toggleLaunchChecklistItemAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('admin.launch.write')
    if (!guard.ok) return guard
    if (!isValidChecklistKey(itemKey)) return { ok: false, message: 'Unknown checklist item.' }

    const def = LAUNCH_CHECKLIST_ITEMS.find((i) => i.key === itemKey)!
    if (def.kind !== 'manual') return { ok: false, message: 'This item is verified automatically.' }

    const admin = createAdminClient()
    const now = new Date().toISOString()
    const { error } = await admin.from('launch_checklist_completions').upsert({
      item_key: itemKey,
      completed,
      completed_at: completed ? now : null,
      completed_by: completed ? guard.session.user.id : null,
      updated_at: now,
    })

    if (error) return adminActionDbFailed('toggleLaunchChecklistItemAction', error)

    revalidatePath(LAUNCH_PATH)
    return { ok: true }
  })
}

export async function updateLaunchQaSignoffAction(
  testKey: string,
  status: 'pending' | 'passed' | 'failed' | 'blocked',
  notes?: string,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('updateLaunchQaSignoffAction', 'admin', async () => {
    const guard = await requirePermissionForAdminAction('admin.launch.write')
    if (!guard.ok) return guard
    if (!isValidQaKey(testKey)) return { ok: false, message: 'Unknown QA test.' }

    const admin = createAdminClient()
    const now = new Date().toISOString()
    const { error } = await admin.from('launch_qa_signoffs').upsert({
      test_key: testKey,
      status,
      notes: notes?.trim() || null,
      updated_at: now,
      updated_by: guard.session.user.id,
    })

    if (error) return adminActionDbFailed('updateLaunchQaSignoffAction', error)

    revalidatePath(LAUNCH_PATH)
    return { ok: true }
  })
}
