import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { buildProfileKycUpdate, type KycDocMinimal } from '@/lib/kyc/compute-kyc-profile-status'
import type { Database } from '@/lib/supabase/database.types'
import { kycActionDbFailed } from '@/lib/kyc/upload-errors'

type Client = SupabaseClient<Database>

/**
 * Recomputes `profiles.kyc_*` and `verification_tier` from `kyc_documents`.
 * Call after customer upload or admin review decision.
 */
export async function syncProfileKycFromDocuments(
  client: Client,
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const nowIso = new Date().toISOString()

  const { data: docs, error: docsErr } = await client
    .from('kyc_documents')
    .select('document_type, status, created_at')
    .eq('user_id', userId)

  if (docsErr) {
    return kycActionDbFailed('syncProfileKycFromDocuments:select_docs', docsErr)
  }

  const { data: profile, error: profErr } = await client
    .from('profiles')
    .select('kyc_submitted_at, kyc_approved_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (profErr) {
    return kycActionDbFailed('syncProfileKycFromDocuments:select_profile', profErr)
  }

  const patch = buildProfileKycUpdate({
    docs: (docs ?? []) as KycDocMinimal[],
    existingKycSubmittedAt: profile?.kyc_submitted_at ?? null,
    existingKycApprovedAt: profile?.kyc_approved_at ?? null,
    nowIso,
  })

  const { error: upErr } = await client
    .from('profiles')
    .update({
      kyc_status: patch.kyc_status,
      verification_tier: patch.verification_tier,
      kyc_approved_at: patch.kyc_approved_at,
      kyc_submitted_at: patch.kyc_submitted_at,
      updated_at: nowIso,
    })
    .eq('user_id', userId)

  if (upErr) {
    return kycActionDbFailed('syncProfileKycFromDocuments:update_profile', upErr)
  }

  return { ok: true }
}
