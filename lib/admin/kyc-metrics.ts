import 'server-only'

import { KYC_IN_REVIEW_DOCUMENT_STATUSES } from '@/lib/admin/status-enums'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

/** Distinct customers with in-review KYC documents (aligns KPI with queue semantics). */
export async function countPendingKycCustomers(): Promise<number> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('kyc_documents')
    .select('user_id')
    .in('status', [...KYC_IN_REVIEW_DOCUMENT_STATUSES])
    .is('deleted_at', null)
    .limit(4000)

  if (error) {
    logPostgrestError('[countPendingKycCustomers]', error)
    return 0
  }
  return new Set((data ?? []).map((r) => r.user_id)).size
}
