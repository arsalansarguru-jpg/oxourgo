'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { StorageError } from '@supabase/storage-js'

import type { Database } from '@/lib/supabase/database.types'
import { KYC_STORAGE_BUCKET } from '@/lib/kyc/constants'
import { inferKycContentType } from '@/lib/kyc/mime'
import { KycUploadError, mapStorageErrorToKycUpload, mapUnknownToKycUpload } from '@/lib/kyc/upload-errors'

const MAX_UPLOAD_ATTEMPTS = 3

function kycUploadLog(label: string, payload: Record<string, unknown>): void {
  console.info(`[kyc-upload] ${label}`, payload)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function isRetryableStorageError(error: StorageError): boolean {
  const status = Number(error.statusCode) || 0
  if (status >= 500 || status === 408 || status === 429) return true
  const msg = (error.message ?? '').toLowerCase()
  return (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('temporarily') ||
    msg.includes('connection')
  )
}

/**
 * Uploads to the private `kyc` bucket via the authenticated browser Supabase client.
 * Refreshes the session first (important on mobile Safari / Chrome) and retries transient failures.
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

  kycUploadLog('upload start', {
    bucket: KYC_STORAGE_BUCKET,
    objectPath: input.objectPath,
    authUserId,
    contentType,
    byteSize: input.file.size,
  })

  let lastError: StorageError | null = null

  for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
    input.onProgress(0.08 + (attempt - 1) * 0.06)

    if (attempt > 1) {
      const { error: retryRefreshErr } = await input.supabase.auth.refreshSession()
      if (retryRefreshErr) {
        console.error('[uploadKycObjectWithProgress] refreshSession on retry failed', retryRefreshErr.message)
        throw new KycUploadError('session_expired', 'Your session expired. Sign in again.')
      }
      await sleep(400 * attempt)
    }

    const { data, error } = await input.supabase.storage.from(KYC_STORAGE_BUCKET).upload(input.objectPath, input.file, {
      cacheControl: '3600',
      upsert: false,
      contentType,
    })

    if (!error) {
      kycUploadLog('upload success', {
        bucket: KYC_STORAGE_BUCKET,
        objectPath: input.objectPath,
        authUserId,
        path: data?.path,
        id: data?.id,
        attempt,
      })
      input.onProgress(1)
      return
    }

    lastError = error
    console.error('[uploadKycObjectWithProgress] storage.upload failed', {
      bucket: KYC_STORAGE_BUCKET,
      objectPath: input.objectPath,
      authUserId,
      attempt,
      maxAttempts: MAX_UPLOAD_ATTEMPTS,
      statusCode: error.statusCode,
      message: error.message,
      name: error.name,
    })

    if (attempt < MAX_UPLOAD_ATTEMPTS && isRetryableStorageError(error)) {
      input.onProgress(0.2 + attempt * 0.15)
      continue
    }

    throw mapStorageErrorToKycUpload(error)
  }

  if (lastError) throw mapStorageErrorToKycUpload(lastError)
  throw mapUnknownToKycUpload(new Error('Upload failed after retries.'))
}
