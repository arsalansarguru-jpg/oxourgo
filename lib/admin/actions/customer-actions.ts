'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { requireAppRole } from '@/lib/auth/server'
import type { Database, Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminActionDbFailed } from '@/lib/errors/safe-user-message'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'

const TIERS = ['none', 'basic', 'verified'] as const

export async function adminUpdateCustomerProfileAction(
  userId: string,
  patch: Pick<
    Database['public']['Tables']['profiles']['Update'],
    'admin_notes' | 'risk_score' | 'verification_tier'
  >,
): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminUpdateCustomerProfileAction', 'admin', async () => {
    const { user } = await requireAppRole('ops_admin')
    if (patch.verification_tier && !(TIERS as readonly string[]).includes(patch.verification_tier)) {
      return { ok: false, message: 'Invalid verification tier.' }
    }
    if (patch.risk_score !== undefined && (patch.risk_score < 0 || patch.risk_score > 100)) {
      return { ok: false, message: 'Risk score must be 0–100.' }
    }

    const admin = createAdminClient()
    const updatedAt = new Date().toISOString()
    const { data: existing } = await admin.from('profiles').select('user_id').eq('user_id', userId).maybeSingle()

    const error = existing
      ? (
          await admin
            .from('profiles')
            .update({ ...patch, updated_at: updatedAt })
            .eq('user_id', userId)
        ).error
      : (
          await admin.from('profiles').insert({
            user_id: userId,
            preferences: {},
            verification_tier: patch.verification_tier ?? 'basic',
            admin_notes: patch.admin_notes ?? null,
            risk_score: patch.risk_score ?? 0,
            updated_at: updatedAt,
          })
        ).error

    if (error) return adminActionDbFailed('adminUpdateCustomerProfileAction', error)

    await writeAdminAudit({
      actorUserId: user.id,
      action: 'customer.profile_update',
      entityType: 'profile',
      entityId: userId,
      payload: patch as Json,
    })

    revalidatePath('/admin/customers')
    revalidatePath(`/admin/customers/${userId}`)
    return { ok: true }
  })
}
