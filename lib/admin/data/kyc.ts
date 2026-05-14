import 'server-only'

import type { Database } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import { logPostgrestError } from '@/lib/errors/safe-user-message'

export type KycQueueRow = Database['public']['Tables']['kyc_documents']['Row'] & {
  user_email: string | null
}

export async function adminListKycDocuments(): Promise<KycQueueRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('kyc_documents').select('*').order('updated_at', { ascending: false }).limit(200)

  if (error) {
    logPostgrestError('[adminListKycDocuments]', error)
    return []
  }
  if (!data?.length) return []

  const out: KycQueueRow[] = []
  for (const row of data) {
    const { data: authUser } = await admin.auth.admin.getUserById(row.user_id)
    out.push({
      ...row,
      user_email: authUser?.user?.email ?? null,
    })
  }
  return out
}
