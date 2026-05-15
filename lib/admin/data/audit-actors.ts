import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export type AuditActorLookup = Record<string, { email: string | null }>

export async function buildAuditActorLookup(actorIds: (string | null | undefined)[]): Promise<AuditActorLookup> {
  const unique = [...new Set(actorIds.filter((id): id is string => Boolean(id)))]
  if (unique.length === 0) return {}

  const admin = createAdminClient()
  const lookup: AuditActorLookup = {}

  await Promise.all(
    unique.map(async (id) => {
      try {
        const { data } = await admin.auth.admin.getUserById(id)
        lookup[id] = { email: data?.user?.email ?? null }
      } catch {
        lookup[id] = { email: null }
      }
    }),
  )

  return lookup
}
