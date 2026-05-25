import type { Metadata } from 'next'

import { getAuthenticatedUser } from '@/lib/auth/server'
import { listCustomerSupportMessages } from '@/lib/customer/support-queries'
import { resolveCustomerDisplayName } from '@/lib/customer/display-name'
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
  const displayName = user
    ? resolveCustomerDisplayName({
        userId: user.id,
        fullName: typeof meta?.full_name === 'string' ? meta.full_name : null,
        email: user.email ?? null,
        phone: typeof meta?.phone === 'string' ? meta.phone : null,
        authMetadata: {
          full_name: typeof meta?.full_name === 'string' ? meta.full_name : undefined,
          name: typeof meta?.name === 'string' ? meta.name : undefined,
          display_name: typeof meta?.display_name === 'string' ? meta.display_name : undefined,
        },
      })
    : null
  const rawFirstName = displayName ? displayName.split(/\s+/)[0] : null
  const isBlacklisted = rawFirstName && /oxour|admin|info|noble|test|co|corp|ltd|pvt|engineering/i.test(rawFirstName)
  const firstName = isBlacklisted ? null : rawFirstName
  const initialMessages = user ? await listCustomerSupportMessages(user.id) : []

  return (
    <SupportView greetingName={firstName} initialMessages={initialMessages} signedIn={Boolean(user)} />
  )
}
