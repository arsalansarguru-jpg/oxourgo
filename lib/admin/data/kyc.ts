import 'server-only'

import { logAdminQueryResult } from '@/lib/admin/debug-query'
import { isInternalTestAccount } from '@/lib/admin/test-accounts'
import { resolveCustomerDisplayName } from '@/lib/customer/display-name'
import { syncProfileKycFromDocuments } from '@/lib/kyc/sync-profile-kyc'
import { KYC_IN_REVIEW_DOCUMENT_STATUSES } from '@/lib/admin/status-enums'
import {
  computeKycLifecycleFromDocuments,
  type KycDocMinimal,
  type KycLifecycleStatus,
} from '@/lib/kyc/compute-kyc-profile-status'
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

function lifecycleMatchesFilter(lifecycle: KycLifecycleStatus, filter: AdminKycListFilter): boolean {
  if (filter === 'all') return lifecycle !== 'not_started'
  return lifecycle === filter
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
  const { data, error } = await admin
    .from('kyc_documents')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(200)

  if (error) {
    logPostgrestError('[adminListKycDocuments]', error)
    return []
  }
  if (!data?.length) return []
  return attachUserEmails(data)
}

/**
 * Dashboard rows: derived from `kyc_documents` (same source as KPI counts), enriched with profiles.
 * Aligns queue with command-center pending KYC metrics.
 */
export async function adminListKycUserSummaries(filter: AdminKycListFilter): Promise<AdminKycUserSummary[]> {
  const admin = createAdminClient()

  const { data: docs, error: docsErr } = await admin
    .from('kyc_documents')
    .select('user_id, document_type, status, created_at, updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(800)

  if (docsErr) {
    logPostgrestError('[adminListKycUserSummaries] documents', docsErr)
    logAdminQueryResult('adminListKycUserSummaries', { rowCount: 0, error: docsErr })
    return []
  }

  const docsByUser = new Map<string, KycDocMinimal[]>()
  const latestUpdated = new Map<string, string>()
  for (const d of docs ?? []) {
    const uid = d.user_id
    if (!docsByUser.has(uid)) docsByUser.set(uid, [])
    docsByUser.get(uid)!.push({
      document_type: d.document_type,
      status: d.status,
      created_at: d.created_at,
    })
    const prev = latestUpdated.get(uid)
    if (!prev || d.updated_at > prev) latestUpdated.set(uid, d.updated_at)
  }

  const candidateUserIds: string[] = []
  for (const [userId, userDocs] of docsByUser) {
    const lifecycle = computeKycLifecycleFromDocuments(userDocs)
    if (!lifecycleMatchesFilter(lifecycle, filter)) continue
    candidateUserIds.push(userId)
  }

  if (!candidateUserIds.length) {
    logAdminQueryResult('adminListKycUserSummaries', { rowCount: 0, meta: { filter, docUsers: docsByUser.size } })
    return []
  }

  const { data: profiles, error: profErr } = await admin
    .from('profiles')
    .select('user_id, full_name, phone, kyc_status, kyc_submitted_at, kyc_approved_at, updated_at')
    .in('user_id', candidateUserIds.slice(0, 120))

  if (profErr) {
    logPostgrestError('[adminListKycUserSummaries] profiles', profErr)
  }

  const profileByUser = new Map((profiles ?? []).map((p) => [p.user_id, p]))

  const out: AdminKycUserSummary[] = []
  for (const userId of candidateUserIds.slice(0, 120)) {
    const userDocs = docsByUser.get(userId) ?? []
    const lifecycle = computeKycLifecycleFromDocuments(userDocs)
    if (!lifecycleMatchesFilter(lifecycle, filter)) continue

    const profile = profileByUser.get(userId)
    const { data: authUser } = await admin.auth.admin.getUserById(userId)
    const email = authUser?.user?.email ?? null
    const meta = authUser?.user?.user_metadata as {
      full_name?: string
      name?: string
      display_name?: string
    } | undefined
    const resolvedName = resolveCustomerDisplayName({
      userId,
      fullName: profile?.full_name ?? null,
      email,
      phone: profile?.phone ?? null,
      authMetadata: meta ?? null,
    })
    if (isInternalTestAccount({ email, displayName: resolvedName })) continue

    const docUpdated = latestUpdated.get(userId) ?? profile?.updated_at ?? new Date().toISOString()

    out.push({
      user_id: userId,
      user_email: email,
      full_name: resolvedName,
      phone: profile?.phone ?? null,
      kyc_status: lifecycle,
      kyc_submitted_at: profile?.kyc_submitted_at ?? userDocs[0]?.created_at ?? null,
      kyc_approved_at: profile?.kyc_approved_at ?? null,
      updated_at: docUpdated,
    })
  }

  out.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  logAdminQueryResult('adminListKycUserSummaries', {
    rowCount: out.length,
    meta: {
      filter,
      docUsers: docsByUser.size,
      inReviewDocs: (docs ?? []).filter((d) =>
        (KYC_IN_REVIEW_DOCUMENT_STATUSES as readonly string[]).includes(d.status),
      ).length,
    },
  })
  return out
}

export async function adminGetKycUserReviewBundle(userId: string): Promise<AdminKycReviewBundle | null> {
  const admin = createAdminClient()

  await syncProfileKycFromDocuments(admin, userId)

  const [{ data: profile, error: pErr }, { data: docs, error: dErr }] = await Promise.all([
    admin
      .from('profiles')
      .select('user_id, full_name, phone, kyc_status, kyc_submitted_at, kyc_approved_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
    admin
      .from('kyc_documents')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])

  if (pErr) logPostgrestError('[adminGetKycUserReviewBundle:profile]', pErr)
  if (dErr) {
    logPostgrestError('[adminGetKycUserReviewBundle:docs]', dErr)
    return null
  }
  if (!profile && !(docs ?? []).length) return null

  const docMinimals = (docs ?? []).map((d) => ({
    document_type: d.document_type,
    status: d.status,
    created_at: d.created_at,
  }))
  const lifecycle = computeKycLifecycleFromDocuments(docMinimals)

  const { data: authUser } = await admin.auth.admin.getUserById(userId)
  const meta = authUser?.user?.user_metadata as {
    full_name?: string
    name?: string
    display_name?: string
  } | undefined
  const summary: AdminKycUserSummary = {
    user_id: userId,
    user_email: authUser?.user?.email ?? null,
    full_name: resolveCustomerDisplayName({
      userId,
      fullName: profile?.full_name ?? null,
      email: authUser?.user?.email ?? null,
      phone: profile?.phone ?? null,
      authMetadata: meta ?? null,
    }),
    phone: profile?.phone ?? null,
    kyc_status: lifecycle,
    kyc_submitted_at: profile?.kyc_submitted_at ?? docMinimals[0]?.created_at ?? null,
    kyc_approved_at: profile?.kyc_approved_at ?? null,
    updated_at: profile?.updated_at ?? docMinimals[0]?.created_at ?? new Date().toISOString(),
  }

  const withEmails = await attachUserEmails(docs ?? [])

  const enriched: AdminKycReviewDocumentRow[] = withEmails.map((d) => ({
    ...d,
    reviewer_email: null,
  }))

  return { profile: summary, documents: enriched }
}
