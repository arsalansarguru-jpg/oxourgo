import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'
import { computeKycLifecycleFromDocuments } from '@/lib/kyc/compute-kyc-profile-status'

/** Distinct customers with in-review KYC documents (aligns KPI with queue semantics). */
export async function countPendingKycCustomers(): Promise<number> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('kyc_documents')
    .select('user_id, document_type, status, created_at')
    .is('deleted_at', null)
    .limit(8000)

  if (error) {
    logPostgrestError('[countPendingKycCustomers]', error)
    return 0
  }

  // Group by user_id
  const docsByUser = new Map<string, Array<{ document_type: string; status: string; created_at: string }>>()
  for (const d of (data ?? [])) {
    const uid = d.user_id
    if (!docsByUser.has(uid)) {
      docsByUser.set(uid, [])
    }
    docsByUser.get(uid)!.push({
      document_type: d.document_type,
      status: d.status,
      created_at: d.created_at,
    })
  }

  let pendingCount = 0
  for (const userDocs of docsByUser.values()) {
    const lifecycle = computeKycLifecycleFromDocuments(userDocs)
    if (lifecycle === 'pending') {
      pendingCount++
    }
  }

  return pendingCount
}
