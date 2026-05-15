'use client'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'
import { inferKycContentType } from '@/lib/kyc/mime'
import { KycUploadError, mapStorageErrorToKycUpload } from '@/lib/kyc/upload-errors'

const KYC_BUCKET = 'kyc' as const

function devLog(label: string, payload: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== 'development') return
  console.info(`[kyc-upload] ${label}`, payload)
}

/**
 * Uploads to the private `kyc` bucket via the authenticated browser Supabase client.
 * Refreshes the session first (important on mobile Safari / Chrome).
 */
export async function uploadKycObjectWithProgress(input: {
  supabase: SupabaseClient<Database>
  objectPath: string
  file: File
  onProgress: (ratio: number) => void
}): Promise<void> {
  const contentType = inferKycContentType(input.file)

  input.onProgress(0.02)

  const { data: refreshed, error: refreshError } = await input.supabase.auth.refreshSession()
  if (refreshError) {
    console.error('[uploadKycObjectWithProgress] refreshSession failed', refreshError.message)
    throw new KycUploadError('session_expired', 'Your session expired. Sign in again.')
  }

  const session = refreshed.session
  const accessToken = session?.access_token
  const authUserId = session?.user?.id

  if (!accessToken || !authUserId) {
    console.error('[uploadKycObjectWithProgress] no session after refresh')
    throw new KycUploadError('session_expired', 'Your session expired. Sign in again.')
  }

  const pathPrefix = input.objectPath.split('/')[0]
  if (pathPrefix !== authUserId) {
    console.error('[uploadKycObjectWithProgress] path prefix mismatch', {
      pathPrefix,
      authUserId,
    })
    throw new KycUploadError('forbidden', 'Upload path does not match your account.')
  }

  devLog('starting', {
    bucket: KYC_BUCKET,
    objectPath: input.objectPath,
    authUserId,
    contentType,
    byteSize: input.file.size,
  })

  input.onProgress(0.12)

  const { data, error } = await input.supabase.storage.from(KYC_BUCKET).upload(input.objectPath, input.file, {
    cacheControl: '3600',
    upsert: false,
    contentType,
  })

  if (error) {
    console.error('[uploadKycObjectWithProgress] storage.upload failed', {
      bucket: KYC_BUCKET,
      objectPath: input.objectPath,
      authUserId,
      statusCode: error.statusCode,
      message: error.message,
      name: error.name,
    })
    throw mapStorageErrorToKycUpload(error)
  }

  devLog('success', {
    bucket: KYC_BUCKET,
    objectPath: input.objectPath,
    authUserId,
    path: data?.path,
    id: data?.id,
  })

  input.onProgress(1)
}
