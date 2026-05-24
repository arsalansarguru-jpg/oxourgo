'use server'

import { revalidatePath } from 'next/cache'

import type { KycDocumentRow } from '@/lib/customer/kyc-queries'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { isRolePlaceholderName } from '@/lib/customer/sanitize-profile-name'
import { onKycSubmitted } from '@/lib/notifications/events'
import { KYC_STORAGE_BUCKET } from '@/lib/kyc/constants'
import { pickLatestDocPerType, type KycDocMinimal } from '@/lib/kyc/compute-kyc-profile-status'
import { syncProfileKycFromDocuments } from '@/lib/kyc/sync-profile-kyc'
import { createClient } from '@/lib/supabase/server'
import { adminActionDbFailed, SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import { isKycObjectPathForUser } from '@/lib/kyc/object-path'
import { verifyKycStorageObject } from '@/lib/kyc/verify-storage-object'
import {
  kycActionDbFailed,
  kycStorageVerifyFailedMessage,
} from '@/lib/kyc/upload-errors'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'

const docTypes = ['aadhaar', 'license', 'passport', 'selfie', 'pan'] as const

export async function updateCustomerProfileAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  return runInstrumentedServerAction('updateCustomerProfileAction', 'auth', async () => {
    const user = await getAuthenticatedUser()
    if (!user) {
      return { ok: false, message: SAFE_USER_MESSAGE.unauthorized }
    }

    const rawName = String(formData.get('fullName') ?? '').trim()
    const fullName = isRolePlaceholderName(rawName) ? '' : rawName

    if (fullName) {
      const parts = fullName.split(/\s+/).filter(Boolean)
      if (parts.length < 2) {
        return { ok: false, message: 'Please enter both your first and last name.' }
      }
    } else {
      return { ok: false, message: 'Full name is required.' }
    }

    const phone = String(formData.get('phone') ?? '').trim()
    const avatarUrl = String(formData.get('avatarUrl') ?? '').trim()

    const supabase = await createClient()
    const { error } = await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        full_name: fullName || null,
        phone: phone || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

    if (error) return adminActionDbFailed('updateCustomerProfileAction', error)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/kyc')
    return { ok: true }
  })
}

export async function registerKycDocumentAction(input: {
  documentType: string
  storagePath: string
  byteSize?: number | null
  contentType?: string | null
  originalFilename?: string | null
}): Promise<{ ok: boolean; message?: string; document?: KycDocumentRow }> {
  return runInstrumentedServerAction('registerKycDocumentAction', 'kyc', async () => {
    const user = await getAuthenticatedUser()
    if (!user) {
      return { ok: false, message: SAFE_USER_MESSAGE.unauthorized }
    }

    if (!docTypes.includes(input.documentType as (typeof docTypes)[number])) {
      return { ok: false, message: 'Invalid document type.' }
    }

    if (!isKycObjectPathForUser(input.storagePath, user.id)) {
      console.error('[registerKycDocumentAction] invalid storage path', {
        userId: user.id,
        storagePath: input.storagePath,
      })
      return { ok: false, message: 'Invalid storage path.' }
    }

    if (input.byteSize != null && (input.byteSize <= 0 || input.byteSize > 8 * 1024 * 1024)) {
      return { ok: false, message: 'Invalid file size.' }
    }

    console.info('[registerKycDocumentAction] register start', {
      userId: user.id,
      documentType: input.documentType,
      storagePath: input.storagePath,
      bucket: KYC_STORAGE_BUCKET,
    })

    const supabase = await createClient()

    const storageCheck = await verifyKycStorageObject(input.storagePath, supabase)
    if (!storageCheck.ok) {
      console.error('[registerKycDocumentAction] storage object not verified', {
        userId: user.id,
        storagePath: input.storagePath,
        bucket: KYC_STORAGE_BUCKET,
      })
      return { ok: false, message: kycStorageVerifyFailedMessage() }
    }

    const insertRow = {
      user_id: user.id,
      document_type: input.documentType,
      storage_path: input.storagePath,
      status: 'pending' as const,
      byte_size: input.byteSize ?? null,
      content_type: input.contentType?.trim() || null,
      original_filename: input.originalFilename?.trim() || null,
    }

    let { data, error } = await supabase.from('kyc_documents').insert(insertRow).select('*').single()

    if (error?.code === 'PGRST116') {
      const { data: recovered, error: fetchErr } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('storage_path', input.storagePath)
        .maybeSingle()

      if (recovered && !fetchErr) {
        data = recovered
        error = null
        console.info('[registerKycDocumentAction] recovered existing row after PGRST116', {
          userId: user.id,
          documentId: recovered.id,
        })
      }
    }

    if (error) {
      console.error('[registerKycDocumentAction] insert failed', {
        userId: user.id,
        documentType: input.documentType,
        storagePath: input.storagePath,
        code: error.code,
        message: error.message,
        details: error.details,
      })
      return kycActionDbFailed('registerKycDocumentAction:insert', error)
    }

    if (!data) {
      console.error('[registerKycDocumentAction] insert returned no row', {
        userId: user.id,
        storagePath: input.storagePath,
      })
      return { ok: false, message: SAFE_USER_MESSAGE.save }
    }

    console.info('[registerKycDocumentAction] insert success', {
      userId: user.id,
      documentId: data.id,
      documentType: input.documentType,
      storagePath: input.storagePath,
    })

    const syncRes = await syncProfileKycFromDocuments(supabase, user.id)
    if (!syncRes.ok) {
      console.error('[registerKycDocumentAction] profile sync failed (document kept)', {
        userId: user.id,
        documentId: data.id,
        storagePath: input.storagePath,
        message: syncRes.message,
      })
    } else {
      console.info('[registerKycDocumentAction] profile sync success', { userId: user.id })
    }

    revalidatePath('/dashboard/kyc')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    revalidatePath('/admin/kyc')
    revalidatePath(`/admin/kyc/review/${user.id}`)
    void onKycSubmitted(user.id, data.id, input.documentType)

    return { ok: true, document: data as KycDocumentRow }
  })
}

function kycReadyForReview(latest: ReturnType<typeof pickLatestDocPerType>): boolean {
  const license = latest.get('license')
  const selfie = latest.get('selfie')
  const idOk = Boolean(latest.get('aadhaar') || latest.get('pan'))
  return Boolean(license && selfie && idOk)
}

/** Marks KYC as submitted for ops review once required document slots are filled. */
export async function submitKycForReviewAction(): Promise<{ ok: boolean; message?: string }> {
  return runInstrumentedServerAction('submitKycForReviewAction', 'kyc', async () => {
    const user = await getAuthenticatedUser()
    if (!user) return { ok: false, message: SAFE_USER_MESSAGE.unauthorized }

    const supabase = await createClient()
    const { data: docs, error } = await supabase
      .from('kyc_documents')
      .select('id, document_type, status, created_at')
      .eq('user_id', user.id)

    if (error) return kycActionDbFailed('submitKycForReviewAction:select_docs', error)

    const latest = pickLatestDocPerType((docs ?? []) as KycDocMinimal[])
    if (!kycReadyForReview(latest)) {
      return {
        ok: false,
        message: 'Upload your driving license, Aadhaar or PAN, and a selfie before submitting for review.',
      }
    }

    const syncRes = await syncProfileKycFromDocuments(supabase, user.id)
    if (!syncRes.ok) return syncRes

    const nowIso = new Date().toISOString()
    const { error: upErr } = await supabase
      .from('profiles')
      .update({ kyc_submitted_at: nowIso, updated_at: nowIso })
      .eq('user_id', user.id)
      .is('kyc_submitted_at', null)

    if (upErr) return kycActionDbFailed('submitKycForReviewAction:update_profile', upErr)

    const notifyDocId = (docs ?? []).find((d) => d.document_type === 'license')?.id ?? (docs ?? [])[0]?.id ?? user.id
    revalidatePath('/dashboard/kyc')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    void onKycSubmitted(user.id, notifyDocId, 'kyc_package')

    return { ok: true }
  })
}
