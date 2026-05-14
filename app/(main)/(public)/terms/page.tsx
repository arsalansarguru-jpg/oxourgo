import type { Metadata } from 'next'

import { LegalProse } from '@/components/legal/legal-prose'
import { buildPageMetadata } from '@/lib/seo/build-page-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms & conditions',
  description:
    'Oxour Go rental terms — identity verification, permitted use, pricing, cancellations, and governing law for Mumbai self-drive bookings.',
  path: '/terms',
  keywords: ['Oxour Go terms', 'rental agreement', 'self drive terms India'],
})

export default function TermsPage() {
  return (
    <LegalProse kicker="Legal" title="Terms & Conditions">
      <p>
        By booking with Oxour Go, you agree to provide accurate identity documents, hold a valid driving
        license, and return the vehicle in the same cosmetic and mechanical condition subject to normal
        wear.
      </p>
      <p>
        Prohibited uses include racing, subleasing, commercial carriage of passengers for hire without
        approval, and crossing international borders without written consent.
      </p>
      <p>
        Pricing includes the daily rental rate, statutory taxes, and disclosed service fees. Fuel,
        tolls, and parking are renter responsibilities unless a bundled package is explicitly selected.
      </p>
      <p>
        Termination: we may cancel a booking for safety, fraud, or force majeure. You may cancel
        subject to the refund windows described in our refund policy.
      </p>
      <p>
        Governing law: Maharashtra, India. For disputes, Mumbai courts shall have exclusive
        jurisdiction unless otherwise required by applicable consumer protection law.
      </p>
    </LegalProse>
  )
}
