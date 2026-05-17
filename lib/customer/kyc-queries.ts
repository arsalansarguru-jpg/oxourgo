import 'server-only'

import { logPostgrestError } from '@/lib/errors/safe-user-message'
import { isMissingRelationError } from '@/lib/supabase/postgrest-errors'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

export type KycDocumentRow = Database['public']['Tables']['kyc_documents']['Row']

export async function listKycDocuments(userId: string): Promise<KycDocumentRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('kyc_documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    if (!isMissingRelationError(error)) {
      logPostgrestError('[listKycDocuments]', error)
    }
    return []
  }
  if (!data) return []
  return data as KycDocumentRow[]
}
