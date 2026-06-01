import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

type Client = SupabaseClient<Database>

/** Remove stale KYC review ops alerts after a document is acted on. */
export async function resolveKycReviewOpsAlerts(
  client: Client,
  input: { documentId: string; customerUserId: string },
): Promise<void> {
  const { data: alerts, error } = await client.from('ops_alerts').select('id, metadata').eq('type', 'kyc_review')

  if (error) {
    console.error('[resolveKycReviewOpsAlerts]', error.message)
    return
  }

  const ids = (alerts ?? [])
    .filter((a) => {
      const meta = (a.metadata ?? {}) as Record<string, unknown>
      const docId = typeof meta.kyc_document_id === 'string' ? meta.kyc_document_id : null
      const userId = typeof meta.customer_user_id === 'string' ? meta.customer_user_id : null
      return docId === input.documentId || userId === input.customerUserId
    })
    .map((a) => a.id)

  if (!ids.length) return

  const { error: delErr } = await client.from('ops_alerts').delete().in('id', ids)
  if (delErr) {
    console.error('[resolveKycReviewOpsAlerts] delete', delErr.message)
  }
}

/** Clears KYC review alerts whose documents were already decided (backfill for legacy rows). */
export async function resolveStaleKycReviewOpsAlerts(client: Client): Promise<void> {
  const { data: alerts, error } = await client.from('ops_alerts').select('id, metadata').eq('type', 'kyc_review')
  if (error || !alerts?.length) return

  const docIds = new Set<string>()
  for (const a of alerts) {
    const docId = (a.metadata as Record<string, unknown>)?.kyc_document_id
    if (typeof docId === 'string') docIds.add(docId)
  }
  if (!docIds.size) return

  const { data: docs } = await client
    .from('kyc_documents')
    .select('id, status')
    .in('id', [...docIds])

  const terminal = new Set(
    (docs ?? []).filter((d) => d.status === 'approved' || d.status === 'rejected').map((d) => d.id),
  )
  if (!terminal.size) return

  const staleIds = alerts
    .filter((a) => {
      const docId = (a.metadata as Record<string, unknown>)?.kyc_document_id
      return typeof docId === 'string' && terminal.has(docId)
    })
    .map((a) => a.id)

  if (staleIds.length) {
    await client.from('ops_alerts').delete().in('id', staleIds)
  }
}
