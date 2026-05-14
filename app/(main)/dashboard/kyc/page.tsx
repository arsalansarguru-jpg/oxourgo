import { redirect } from 'next/navigation'

import { KycCenterClient } from '@/features/dashboard/kyc-center-client'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { getSupabasePublicEnv } from '@/lib/env/supabase-public'
import { listKycDocuments } from '@/lib/customer/kyc-queries'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function KycPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard/kyc' }).toString()}`)
  }
  const supabase = await createClient()
  const [docs, profileRes] = await Promise.all([
    listKycDocuments(user.id),
    supabase
      .from('profiles')
      .select('full_name, phone, avatar_url, kyc_status, kyc_submitted_at, kyc_approved_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])
  const env = getSupabasePublicEnv()
  const initialProfile = {
    full_name: profileRes.data?.full_name ?? null,
    phone: profileRes.data?.phone ?? null,
    avatar_url: profileRes.data?.avatar_url ?? null,
    kyc_status: (profileRes.data?.kyc_status as string | undefined) ?? 'not_started',
    kyc_submitted_at: profileRes.data?.kyc_submitted_at ?? null,
    kyc_approved_at: profileRes.data?.kyc_approved_at ?? null,
  }
  return (
    <KycCenterClient
      userId={user.id}
      initialDocs={docs}
      initialProfile={initialProfile}
      projectUrl={env?.url ?? null}
      anonKey={env?.anonKey ?? null}
    />
  )
}
