'use server'

import { revalidatePath } from 'next/cache'

import type { KycDocumentRow } from '@/lib/customer/kyc-queries'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { onKycSubmitted } from '@/lib/notifications/events'
import { syncProfileKycFromDocuments } from '@/lib/kyc/sync-profile-kyc'
import { createClient } from '@/lib/supabase/server'
import { adminActionDbFailed, SAFE_USER_MESSAGE } from '@/lib/errors/safe-user-message'

const docTypes = ['aadhaar', 'license', 'passport', 'selfie', 'pan'] as const

export async function updateCustomerProfileAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
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
}

export async function registerKycDocumentAction(input: {
  documentType: string
  storagePath: string
  byteSize?: number | null
  contentType?: string | null
  originalFilename?: string | null
}): Promise<{ ok: boolean; message?: string; document?: KycDocumentRow }> {
  const user = await getAuthenticatedUser()
  if (!user) {
    return { ok: false, message: SAFE_USER_MESSAGE.unauthorized }
  }

  if (!docTypes.includes(input.documentType as (typeof docTypes)[number])) {
    return { ok: false, message: 'Invalid document type.' }
  }

  if (!input.storagePath.startsWith(`${user.id}/`)) {
    return { ok: false, message: 'Invalid storage path.' }
  }

  if (input.byteSize != null && (input.byteSize <= 0 || input.byteSize > 8 * 1024 * 1024)) {
    return { ok: false, message: 'Invalid file size.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('kyc_documents')
    .insert({
      user_id: user.id,
      document_type: input.documentType,
      storage_path: input.storagePath,
      status: 'pending',
      byte_size: input.byteSize ?? null,
      content_type: input.contentType?.trim() || null,
      original_filename: input.originalFilename?.trim() || null,
    })
    .select('*')
    .single()

  if (error) return adminActionDbFailed('registerKycDocumentAction', error)

  const syncRes = await syncProfileKycFromDocuments(supabase, user.id)
  if (!syncRes.ok) {
    if (data?.id) {
      await supabase.from('kyc_documents').delete().eq('id', data.id)
    }
    await supabase.storage.from('kyc').remove([input.storagePath]).catch(() => {})
    return { ok: false, message: syncRes.message }
  }

  revalidatePath('/dashboard/kyc')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/bookings')
  revalidatePath('/admin/kyc')
  if (data) {
    void onKycSubmitted(user.id, data.id, input.documentType)
  }
  return { ok: true, document: data as KycDocumentRow }
}
