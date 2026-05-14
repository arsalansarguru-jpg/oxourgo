import 'server-only'

import type { Database } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type KycQueueRow = Database['public']['Tables']['kyc_documents']['Row'] & {
  user_email: string | null
}

export type AdminKycListFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'resubmission_required'

export type AdminKycUserSummary = {
  user_id: string
  user_email: string | null
  full_name: string | null
  phone: string | null
  kyc_status: string
  kyc_submitted_at: string | null
  kyc_approved_at: string | null
  updated_at: string
}

export type AdminKycReviewDocumentRow = KycQueueRow & {
  reviewer_email?: string | null
}

export type AdminKycReviewBundle = {
  profile: AdminKycUserSummary
  documents: AdminKycReviewDocumentRow[]
}

async function attachUserEmails(rows: Database['public']['Tables']['kyc_documents']['Row'][]): Promise<KycQueueRow[]> {
  const admin = createAdminClient()
  const out: KycQueueRow[] = []
  for (const row of rows) {
    const { data: authUser } = await admin.auth.admin.getUserById(row.user_id)
    out.push({
      ...row,
      user_email: authUser?.user?.email ?? null,
    })
  }
  return out
}

/** Legacy flat document list (most recent first). */
export async function adminListKycDocuments(): Promise<KycQueueRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('kyc_documents').select('*').order('updated_at', { ascending: false }).limit(200)

  if (error) {
    logPostgrestError('[adminListKycDocuments]', error)
    return []
  }
  if (!data?.length) return []
  return attachUserEmails(data)
}

/**
 * Dashboard rows: customers with KYC activity, filterable by aggregate `profiles.kyc_status`.
 */
export async function adminListKycUserSummaries(filter: AdminKycListFilter): Promise<AdminKycUserSummary[]> {
  const admin = createAdminClient()
  let q = admin
    .from('profiles')
    .select('user_id, full_name, phone, kyc_status, kyc_submitted_at, kyc_approved_at, updated_at')
    .neq('kyc_status', 'not_started')
    .order('updated_at', { ascending: false })
    .limit(120)

  if (filter !== 'all') {
    q = q.eq('kyc_status', filter)
  }

  const { data, error } = await q
  if (error) {
    logPostgrestError('[adminListKycUserSummaries]', error)
    return []
  }
  if (!data?.length) return []

  const out: AdminKycUserSummary[] = []
  for (const row of data) {
    const { data: authUser } = await admin.auth.admin.getUserById(row.user_id)
    out.push({
      user_id: row.user_id,
      user_email: authUser?.user?.email ?? null,
      full_name: row.full_name ?? null,
      phone: row.phone ?? null,
      kyc_status: row.kyc_status ?? 'not_started',
      kyc_submitted_at: row.kyc_submitted_at ?? null,
      kyc_approved_at: row.kyc_approved_at ?? null,
      updated_at: row.updated_at,
    })
  }
  return out
}

export async function adminGetKycUserReviewBundle(userId: string): Promise<AdminKycReviewBundle | null> {
  const admin = createAdminClient()

  const [{ data: profile, error: pErr }, { data: docs, error: dErr }] = await Promise.all([
    admin
      .from('profiles')
      .select('user_id, full_name, phone, kyc_status, kyc_submitted_at, kyc_approved_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
    admin.from('kyc_documents').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
  ])

  if (pErr) {
    logPostgrestError('[adminGetKycUserReviewBundle:profile]', pErr)
    return null
  }
  if (dErr) {
    logPostgrestError('[adminGetKycUserReviewBundle:docs]', dErr)
    return null
  }
  if (!profile) return null

  const { data: authUser } = await admin.auth.admin.getUserById(userId)
  const summary: AdminKycUserSummary = {
    user_id: profile.user_id,
    user_email: authUser?.user?.email ?? null,
    full_name: profile.full_name ?? null,
    phone: profile.phone ?? null,
    kyc_status: profile.kyc_status ?? 'not_started',
    kyc_submitted_at: profile.kyc_submitted_at ?? null,
    kyc_approved_at: profile.kyc_approved_at ?? null,
    updated_at: profile.updated_at,
  }

  const withEmails = await attachUserEmails(docs ?? [])

  const reviewerIds = [...new Set(withEmails.map((d) => d.reviewed_by).filter((x): x is string => Boolean(x)))]
  const reviewerMap = new Map<string, string | null>()
  for (const rid of reviewerIds) {
    const { data: rev } = await admin.auth.admin.getUserById(rid)
    reviewerMap.set(rid, rev?.user?.email ?? null)
  }

  const enriched: AdminKycReviewDocumentRow[] = withEmails.map((d) => ({
    ...d,
    reviewer_email: d.reviewed_by ? reviewerMap.get(d.reviewed_by) ?? null : null,
  }))

  return { profile: summary, documents: enriched }
}
