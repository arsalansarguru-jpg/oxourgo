import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { KYC_STORAGE_BUCKET } from '@/lib/kyc/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'

const VERIFY_ATTEMPTS = 4
const VERIFY_BASE_DELAY_MS = 250

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function tryAdminClient(): SupabaseClient<Database> | null {
  try {
    return createAdminClient()
  } catch (e) {
    console.warn('[verifyKycStorageObject] service role unavailable', e)
    return null
  }
}

async function probeObject(
  client: SupabaseClient<Database>,
  storagePath: string,
  userClient: SupabaseClient<Database>,
): Promise<boolean> {
  const { data, error } = await client.storage.from(KYC_STORAGE_BUCKET).createSignedUrl(storagePath, 60)

  if (!error && data?.signedUrl) {
    return true
  }

  const folder = storagePath.split('/')[0] ?? ''
  const filename = storagePath.slice(folder.length + 1)
  const { data: listed, error: listErr } = await userClient.storage.from(KYC_STORAGE_BUCKET).list(folder, {
    limit: 20,
    search: filename,
  })

  if (!listErr && listed?.some((o) => o.name === filename)) {
    return true
  }

  console.error('[verifyKycStorageObject] probe failed', {
    bucket: KYC_STORAGE_BUCKET,
    storagePath,
    signedUrlMessage: error?.message,
    signedUrlStatus: error?.statusCode,
    listMessage: listErr?.message,
  })

  return false
}

/**
 * Confirms the object exists in the private `kyc` bucket after a browser upload.
 * Prefers service role (no RLS/session drift); retries briefly for mobile replication lag.
 */
export async function verifyKycStorageObject(
  storagePath: string,
  userClient: SupabaseClient<Database>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = tryAdminClient()

  for (let attempt = 1; attempt <= VERIFY_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      await sleep(VERIFY_BASE_DELAY_MS * attempt)
    }

    const client = admin ?? userClient
    const found = await probeObject(client, storagePath, userClient)

    if (found) {
      if (attempt > 1) {
        console.info('[verifyKycStorageObject] object visible after retry', {
          bucket: KYC_STORAGE_BUCKET,
          storagePath,
          attempt,
        })
      }
      return { ok: true }
    }
  }

  console.error('[verifyKycStorageObject] object not found after retries', {
    bucket: KYC_STORAGE_BUCKET,
    storagePath,
    attempts: VERIFY_ATTEMPTS,
    usedAdmin: Boolean(admin),
  })

  return { ok: false, message: 'storage_missing' }
}
