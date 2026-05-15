'use server'

import { revalidatePath } from 'next/cache'

import type { KycDocumentRow } from '@/lib/customer/kyc-queries'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { onKycSubmitted } from '@/lib/notifications/events'
import { syncProfileKycFromDocuments } from '@/lib/kyc/sync-profile-kyc'
import { createClient } from '@/lib/supabase/server'
import { adminActionDbFailed, logUnknownError, SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'
import { isKycObjectPathForUser } from '@/lib/kyc/object-path'
import { kycActionDbFailed, kycStorageObjectMissingMessage } from '@/lib/kyc/upload-errors'
import { runInstrumentedServerAction } from '@/lib/monitoring/instrument-server-action'

const docTypes = ['aadhaar', 'license', 'passport', 'selfie', 'pan'] as const

export async function updateCustomerProfileAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
  return runInstrumentedServerAction('updateCustomerProfileAction', 'auth', async () => {
    const user = await getAuthenticatedUser()
    if (!user) {
      return { ok: false, message: SAFE_USER_MESSAGE.unauthorized }
    }

    const fullName = String(formData.get('fullName') ?? '').trim()
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

    const supabase = await createClient()

    const { data: stored, error: storageErr } = await supabase.storage
      .from('kyc')
      .createSignedUrl(input.storagePath, 60)

    if (storageErr || !stored?.signedUrl) {
      console.error('[registerKycDocumentAction] storage object not readable', {
        userId: user.id,
        storagePath: input.storagePath,
        bucket: 'kyc',
        message: storageErr?.message,
        statusCode: storageErr?.statusCode,
      })
      return { ok: false, message: kycStorageObjectMissingMessage() }
    }

    const { data, error } = await supabase
      .from('kyc_documents')
      .insert({
        user_id: user.id,
        document_type: input.documentType,
        storage_path: input.storagePath,
        status: 'pending',
        reviewer_note: null,
        rejection_reason: null,
        reviewed_at: null,
        reviewed_by: null,
        byte_size: input.byteSize ?? null,
        content_type: input.contentType?.trim() || null,
        original_filename: input.originalFilename?.trim() || null,
      })
      .select('*')
      .single()

    if (error) {
      return kycActionDbFailed('registerKycDocumentAction:insert', error)
    }

    const syncRes = await syncProfileKycFromDocuments(supabase, user.id)
    if (!syncRes.ok) {
      if (data?.id) {
        await supabase.from('kyc_documents').delete().eq('id', data.id).then(({ error: delErr }) => {
          if (delErr) logUnknownError('registerKycDocumentAction:rollback_delete', delErr)
        })
      }
      await supabase.storage.from('kyc').remove([input.storagePath]).catch((removeErr) => {
        logUnknownError('registerKycDocumentAction:rollback_storage', removeErr)
      })
      console.error('[registerKycDocumentAction] profile sync failed', {
        userId: user.id,
        storagePath: input.storagePath,
        message: syncRes.message,
      })
      return { ok: false, message: syncRes.message }
    }

    revalidatePath('/dashboard/kyc')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/bookings')
    revalidatePath('/admin/kyc')
    revalidatePath(`/admin/kyc/review/${user.id}`)
    if (data) {
      void onKycSubmitted(user.id, data.id, input.documentType)
    }
    return { ok: true, document: data as KycDocumentRow }
  })
}
