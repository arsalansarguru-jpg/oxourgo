import type { Metadata } from 'next'

import { getAuthenticatedUser } from '@/lib/auth/server'
import { buildPageMetadata } from '@/lib/seo/build-page-metadata'
import { SupportView } from '@/features/support/support-view'

export const metadata: Metadata = buildPageMetadata({
  title: 'Support & concierge',
  description:
    '24×7 Oxour Go support for bookings, billing, roadside assistance, and Mumbai self-drive questions — with human escalation when you need it.',
  path: '/support',
  keywords: ['Oxour Go support', 'luxury rental help', 'Mumbai roadside', 'concierge'],
})

export default async function SupportPage() {
  const user = await getAuthenticatedUser()
  const meta = user?.user_metadata as Record<string, unknown> | undefined
  const fullName = typeof meta?.full_name === 'string' ? meta.full_name.trim() : ''
  const firstName = fullName ? fullName.split(/\s+/)[0] : (user?.email?.split('@')[0] ?? null)

  return <SupportView greetingName={firstName} />
}
