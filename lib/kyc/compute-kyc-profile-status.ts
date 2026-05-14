/** Pure helpers: derive profile KYC lifecycle from document rows (latest per type). */

export type KycLifecycleStatus = 'not_started' | 'pending' | 'approved' | 'rejected'

export type KycDocMinimal = { document_type: string; status: string; created_at: string }

export function pickLatestDocPerType(docs: KycDocMinimal[]): Map<string, KycDocMinimal> {
  const sorted = [...docs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const map = new Map<string, KycDocMinimal>()
  for (const d of sorted) {
    if (!map.has(d.document_type)) map.set(d.document_type, d)
  }
  return map
}

/** Govt ID slot: Aadhaar or PAN satisfies the gate once either is approved. */
function idGate(latest: Map<string, KycDocMinimal>): 'ok' | 'rejected' | 'pending' | 'missing' {
  const a = latest.get('aadhaar')
  const p = latest.get('pan')
  const hasA = Boolean(a)
  const hasP = Boolean(p)
  if (!hasA && !hasP) return 'missing'
  if (a?.status === 'approved' || p?.status === 'approved') return 'ok'
  if (hasA && hasP) {
    if (a?.status === 'rejected' && p?.status === 'rejected') return 'rejected'
    return 'pending'
  }
  if (hasA && a?.status === 'rejected') return 'rejected'
  if (hasP && p?.status === 'rejected') return 'rejected'
  return 'pending'
}

export function computeKycLifecycleFromDocuments(docs: KycDocMinimal[]): KycLifecycleStatus {
  if (!docs.length) return 'not_started'

  const latest = pickLatestDocPerType(docs)
  const license = latest.get('license')
  const selfie = latest.get('selfie')
  const idg = idGate(latest)

  if (license?.status === 'rejected' || selfie?.status === 'rejected') return 'rejected'
  if (idg === 'rejected') return 'rejected'

  if (license?.status === 'approved' && selfie?.status === 'approved' && idg === 'ok') return 'approved'
  return 'pending'
}

function earliestCreatedAt(docs: KycDocMinimal[]): string | null {
  if (!docs.length) return null
  let min = docs[0]!.created_at
  for (const d of docs) {
    if (new Date(d.created_at).getTime() < new Date(min).getTime()) min = d.created_at
  }
  return min
}

export function buildProfileKycUpdate(input: {
  docs: KycDocMinimal[]
  existingKycSubmittedAt: string | null
  existingKycApprovedAt: string | null
  nowIso: string
}): {
  kyc_status: KycLifecycleStatus
  verification_tier: 'basic' | 'verified'
  kyc_approved_at: string | null
  kyc_submitted_at: string | null
} {
  const lifecycle = computeKycLifecycleFromDocuments(input.docs)
  const minCreated = earliestCreatedAt(input.docs)

  const kyc_submitted_at =
    input.docs.length === 0 ? null : (input.existingKycSubmittedAt ?? minCreated)

  const verification_tier: 'basic' | 'verified' = lifecycle === 'approved' ? 'verified' : 'basic'

  const kyc_approved_at =
    lifecycle === 'approved' ? (input.existingKycApprovedAt ?? input.nowIso) : null

  return {
    kyc_status: lifecycle,
    verification_tier,
    kyc_approved_at,
    kyc_submitted_at,
  }
}
