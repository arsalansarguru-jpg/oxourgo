import type { Metadata } from 'next'

import { LegalProse } from '@/components/legal/legal-prose'
import { buildPageMetadata } from '@/lib/seo/build-page-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Cookie policy',
  description:
    'How Oxour Go uses essential, analytics, and marketing cookies on the luxury self-drive marketing site and how to control them.',
  path: '/cookies',
  keywords: ['Oxour Go cookies', 'privacy controls', 'analytics cookies'],
})

export default function CookiesPage() {
  return (
    <LegalProse kicker="Legal" title="Cookie Policy">
      <p>
        We use essential cookies for authentication and security. Analytics cookies help us understand
        which fleet pages resonate; you can disable non-essential cookies in your browser.
      </p>
      <p>
        Marketing partners may set cookies when you arrive from campaigns. We honor global privacy
        signals where technically feasible and legally required.
      </p>
      <p>
        Cookie lists are reviewed quarterly. For questions, contact our privacy desk via the email on
        our support page.
      </p>
    </LegalProse>
  )
}
