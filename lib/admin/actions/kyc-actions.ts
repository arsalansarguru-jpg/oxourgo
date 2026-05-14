'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { requireAppRole } from '@/lib/auth/server'
import { onKycDecision } from '@/lib/notifications/events'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminActionDbFailed, logUnknownError, SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'

function nowIso() {
  return new Date().toISOString()
}

async function maybePromoteVerification(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: docs } = await admin.from('kyc_documents').select('status').eq('user_id', userId)
  if (!docs?.length) return
  const allApproved = docs.every((d) => d.status === 'approved')
  if (allApproved) {
    await admin
      .from('profiles')
      .update({ verification_tier: 'verified', updated_at: nowIso() })
      .eq('user_id', userId)
  }
}

export async function adminSetKycDocumentStatusAction(input: {
  documentId: string
  status: 'reviewing' | 'approved' | 'rejected'
  reviewer_note?: string | null
}): Promise<AdminActionResult> {
  const { user } = await requireAppRole('ops_admin')
  const admin = createAdminClient()

  const { data: doc, error: fetchErr } = await admin
    .from('kyc_documents')
    .select('user_id, document_type')
    .eq('id', input.documentId)
    .single()
  if (fetchErr || !doc) return { ok: false, message: 'Document not found.' }

  const { error } = await admin
    .from('kyc_documents')
    .update({
      status: input.status,
      reviewer_note: input.reviewer_note?.trim() || null,
      reviewed_at: nowIso(),
      reviewed_by: user.id,
      updated_at: nowIso(),
    })
    .eq('id', input.documentId)

  if (error) return adminActionDbFailed('adminSetKycDocumentStatusAction', error)

  if (input.status === 'approved') {
    await maybePromoteVerification(admin, doc.user_id)
  }

  await writeAdminAudit({
    actorUserId: user.id,
    action: `kyc.${input.status}`,
    entityType: 'kyc_document',
    entityId: input.documentId,
    payload: { user_id: doc.user_id, note: input.reviewer_note ?? null },
  })

  if (input.status === 'approved' || input.status === 'rejected') {
    void onKycDecision(doc.user_id, input.documentId, doc.document_type, input.status, input.reviewer_note)
  }

  revalidatePath('/admin/kyc')
  revalidatePath('/admin/customers')
  revalidatePath(`/admin/customers/${doc.user_id}`)
  revalidatePath('/dashboard/kyc')
  return { ok: true }
}

export async function adminGetKycSignedUrlAction(documentId: string): Promise<
  | { ok: true; url: string; expiresIn: number }
  | { ok: false; message: string }
> {
  await requireAppRole('ops_admin')
  const admin = createAdminClient()

  const { data: doc, error } = await admin.from('kyc_documents').select('storage_path').eq('id', documentId).single()
  if (error || !doc?.storage_path) return { ok: false, message: 'Document not found.' }

  const { data: signed, error: signErr } = await admin.storage
    .from('kyc')
    .createSignedUrl(doc.storage_path, 120)

  if (signErr || !signed?.signedUrl) {
    if (signErr) logUnknownError('adminGetKycSignedUrlAction:storage', signErr)
    return { ok: false, message: SAFE_USER_MESSAGE.generic }
  }

  return { ok: true, url: signed.signedUrl, expiresIn: 120 }
}
