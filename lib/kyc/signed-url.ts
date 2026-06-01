import 'server-only'

import type { StorageError } from '@supabase/storage-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import { KYC_STORAGE_BUCKET } from '@/lib/kyc/constants'
import type { Database } from '@/lib/supabase/database.types'

export function normalizeKycStoragePath(path: string): string {
  return path.trim().replace(/^\/+/, '')
}

export function mapKycStorageSignError(error: StorageError | null): string {
  if (!error) {
    return 'Could not load a secure preview link. Try Refresh link or Open / download.'
  }

  const status = Number(error.statusCode) || 0
  const msg = (error.message ?? '').toLowerCase()

  if (status === 404 || msg.includes('not found') || msg.includes('object not found')) {
    return 'The vault file is missing. Ask the customer to re-upload this document.'
  }
  if (status === 400 && (msg.includes('bucket') || msg.includes('not found'))) {
    return 'Could not access the KYC vault bucket. Verify the private "kyc" bucket exists and storage policies are applied.'
  }
  if (status === 403 || msg.includes('policy') || msg.includes('row-level security')) {
    return 'Unable to access this vault file with admin credentials. Check storage policies for the kyc bucket.'
  }

  return 'Could not load a secure preview link. Try Refresh link or Open / download.'
}

/**
 * Creates a short-lived signed URL for an object in the private `kyc` bucket.
 */
export async function createKycSignedUrl(
  client: SupabaseClient<Database>,
  storagePath: string,
  expiresIn: number,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const path = normalizeKycStoragePath(storagePath)
  if (!path) {
    return { ok: false, message: 'Document storage path is missing.' }
  }

  const { data, error } = await client.storage.from(KYC_STORAGE_BUCKET).createSignedUrl(path, expiresIn)

  if (!error && data?.signedUrl) {
    return { ok: true, url: data.signedUrl }
  }

  const { data: downloadData, error: downloadErr } = await client.storage
    .from(KYC_STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn, { download: false })

  if (!downloadErr && downloadData?.signedUrl) {
    return { ok: true, url: downloadData.signedUrl }
  }

  return { ok: false, message: mapKycStorageSignError(error ?? downloadErr) }
}
