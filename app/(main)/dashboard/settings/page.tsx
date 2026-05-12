import { redirect } from 'next/navigation'

import { CustomerSettingsForm } from '@/features/dashboard/customer-settings-form'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?${new URLSearchParams({ redirect: '/dashboard/settings' }).toString()}`)
  }
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle()

  return <CustomerSettingsForm user={user} profile={profile} />
}
