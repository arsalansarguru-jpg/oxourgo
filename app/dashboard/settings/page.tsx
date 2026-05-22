import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { CustomerSettingsForm } from '@/features/dashboard/customer-settings-form'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Account settings',
  description: 'Manage your Oxour Go profile and contact details.',
}

export default async function SettingsPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard/settings' }).toString()}`)
  }
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle()

  return <CustomerSettingsForm user={user} profile={profile} />
}
