'use server'

import { revalidatePath } from 'next/cache'

import type { AdminActionResult } from '@/lib/admin/actions/types'
import { writeAdminAudit } from '@/lib/admin/audit'
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@/lib/audit/actions'
import { requirePermissionForAdminAction } from '@/lib/auth/admin-action-auth'
import { onKycDecision } from '@/lib/notifications/events'
import { KYC_STORAGE_BUCKET } from '@/lib/kyc/constants'
import { syncProfileKycFromDocuments } from '@/lib/kyc/sync-profile-kyc'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminActionDbFailed, logUnknownError, SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'

function nowIso() {
  return new Date().toISOString()
}

export type AdminKycSetStatusInput = {
  documentId: string
  status: 'reviewing' | 'approved' | 'rejected' | 'resubmission_required'
  reviewer_note?: string | null
  /** Shown to the customer when rejecting or requesting resubmission. */
  rejection_reason?: string | null
}

export async function adminSetKycDocumentStatusAction(input: AdminKycSetStatusInput): Promise<AdminActionResult> {
  return runInstrumentedServerAction('adminSetKycDocumentStatusAction', 'kyc', async () => {
    const guard = await requirePermissionForAdminAction('kyc.review')
    if (!guard.ok) return guard
    const { user } = guard.session
    const admin = createAdminClient()

    if (input.status === 'rejected' || input.status === 'resubmission_required') {
      const rr = input.rejection_reason?.trim()
      if (!rr) {
        return { ok: false, message: 'Please enter a short reason the customer will see.' }
      }
    }

    const { data: doc, error: fetchErr } = await admin
      .from('kyc_documents')
      .select('user_id, document_type')
      .eq('id', input.documentId)
      .single()
    if (fetchErr || !doc) return { ok: false, message: 'Document not found.' }

    const rejectionReason =
      input.status === 'rejected' || input.status === 'resubmission_required'
        ? input.rejection_reason?.trim() || null
        : null

    const { error } = await admin
      .from('kyc_documents')
      .update({
        status: input.status,
        reviewer_note: input.reviewer_note?.trim() || null,
        rejection_reason: rejectionReason,
        reviewed_at: nowIso(),
        reviewed_by: user.id,
        updated_at: nowIso(),
        ...(input.status === 'approved'
          ? {
              storage_pinned: true,
              recovery_metadata: {
                pinnedAt: nowIso(),
                pinnedBy: user.id,
                reason: 'kyc_approved',
              },
            }
          : {}),
      })
      .eq('id', input.documentId)

    if (error) return adminActionDbFailed('adminSetKycDocumentStatusAction', error)

    const syncRes = await syncProfileKycFromDocuments(admin, doc.user_id)
    if (!syncRes.ok) {
      return { ok: false, message: syncRes.message }
    }

    const kycAction =
      input.status === 'approved'
        ? AUDIT_ACTIONS.kycApproved
        : input.status === 'rejected'
          ? AUDIT_ACTIONS.kycRejected
          : input.status === 'resubmission_required'
            ? AUDIT_ACTIONS.kycResubmission
            : `kyc.${input.status}`

    await writeAdminAudit({
      actorUserId: user.id,
      actorRole: guard.session.appRole,
      action: kycAction,
      entityType: AUDIT_ENTITY_TYPES.kyc,
      entityId: input.documentId,
      metadata: {
        userId: doc.user_id,
        documentType: doc.document_type,
        note: input.reviewer_note ?? null,
        rejectionReason,
      },
    })

    if (input.status === 'approved' || input.status === 'rejected' || input.status === 'resubmission_required') {
      const customerMessage = rejectionReason ?? input.reviewer_note?.trim() ?? null
      void onKycDecision(doc.user_id, input.documentId, doc.document_type, input.status, customerMessage)
    }

    revalidatePath('/admin/kyc')
    revalidatePath(`/admin/kyc/review/${doc.user_id}`)
    revalidatePath('/admin/customers')
    revalidatePath(`/admin/customers/${doc.user_id}`)
    revalidatePath('/dashboard/kyc')
    revalidatePath('/dashboard/bookings')
    revalidatePath('/dashboard')
    return { ok: true }
  })
}

const SIGNED_URL_MIN = 60
const SIGNED_URL_MAX = 3600
const SIGNED_URL_DEFAULT = 900

export async function adminGetKycSignedUrlAction(
  documentId: string,
  ttlSeconds?: number,
): Promise<{ ok: true; url: string; expiresIn: number } | { ok: false; message: string }> {
  return runInstrumentedServerAction('adminGetKycSignedUrlAction', 'kyc', async () => {
    const guard = await requirePermissionForAdminAction('kyc.review')
    if (!guard.ok) return guard
    const admin = createAdminClient()

    const { data: doc, error } = await admin.from('kyc_documents').select('storage_path').eq('id', documentId).single()
    if (error || !doc?.storage_path) return { ok: false, message: 'Document not found.' }

    const raw = ttlSeconds ?? SIGNED_URL_DEFAULT
    const expiresIn = Math.min(SIGNED_URL_MAX, Math.max(SIGNED_URL_MIN, Number.isFinite(raw) ? raw : SIGNED_URL_DEFAULT))

    const { data: signed, error: signErr } = await admin.storage
      .from(KYC_STORAGE_BUCKET)
      .createSignedUrl(doc.storage_path, expiresIn)

    if (signErr || !signed?.signedUrl) {
      if (signErr) {
        console.error('[adminGetKycSignedUrlAction] signed URL failed', {
          bucket: KYC_STORAGE_BUCKET,
          storagePath: doc.storage_path,
          message: signErr.message,
          statusCode: signErr.statusCode,
        })
        logUnknownError('adminGetKycSignedUrlAction:storage', signErr)
      }
      return { ok: false, message: SAFE_USER_MESSAGE.generic }
    }

    return { ok: true, url: signed.signedUrl, expiresIn }
  })
}
