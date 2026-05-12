import { redirect } from 'next/navigation'

import { KycCenterClient } from '@/features/dashboard/kyc-center-client'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { getSupabasePublicEnv } from '@/lib/env/supabase-public'
import { listKycDocuments } from '@/lib/customer/kyc-queries'

export const dynamic = 'force-dynamic'

export default async function KycPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard/kyc' }).toString()}`)
  }
  const docs = await listKycDocuments(user.id)
  const env = getSupabasePublicEnv()
  return (
    <KycCenterClient
      userId={user.id}
      initialDocs={docs}
      projectUrl={env?.url ?? null}
      anonKey={env?.anonKey ?? null}
    />
  )
}
