import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { KycCenterClient } from '@/features/dashboard/kyc-center-client'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { listKycDocuments } from '@/lib/customer/kyc-queries'
import { DEFAULT_CUSTOMER_PROFILE, getCustomerProfileSnapshot } from '@/lib/customer/profile-queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'KYC center',
  description: 'Upload identity documents for Oxour Go verification.',
}

export default async function KycPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard/kyc' }).toString()}`)
  }
  const [docs, profile] = await Promise.all([
    listKycDocuments(user.id),
    getCustomerProfileSnapshot(user.id),
  ])
  const initialProfile = {
    full_name: profile.full_name ?? DEFAULT_CUSTOMER_PROFILE.full_name,
    phone: profile.phone ?? DEFAULT_CUSTOMER_PROFILE.phone,
    avatar_url: profile.avatar_url ?? DEFAULT_CUSTOMER_PROFILE.avatar_url,
    kyc_status: profile.kyc_status,
    kyc_submitted_at: profile.kyc_submitted_at,
    kyc_approved_at: profile.kyc_approved_at,
  }
  return (
    <KycCenterClient userId={user.id} initialDocs={docs} initialProfile={initialProfile} />
  )
}
