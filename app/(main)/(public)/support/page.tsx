import { getAuthenticatedUser } from '@/lib/auth/server'

import { SupportView } from '@/features/support/support-view'

export default async function SupportPage() {
  const user = await getAuthenticatedUser()
  const meta = user?.user_metadata as Record<string, unknown> | undefined
  const fullName = typeof meta?.full_name === 'string' ? meta.full_name.trim() : ''
  const firstName = fullName ? fullName.split(/\s+/)[0] : (user?.email?.split('@')[0] ?? null)

  return <SupportView greetingName={firstName} />
}
