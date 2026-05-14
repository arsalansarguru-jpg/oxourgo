import type { Metadata } from 'next'

import { LegalProse } from '@/components/legal/legal-prose'
import { buildPageMetadata } from '@/lib/seo/build-page-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Insurance & protection',
  description:
    'Motor insurance, deductibles, optional protection bundles, and claims reporting for Oxour Go luxury self-drive rentals in Mumbai.',
  path: '/insurance',
  keywords: ['rental insurance Mumbai', 'Oxour Go coverage', 'motor insurance self drive'],
})

export default function InsurancePage() {
  return (
    <LegalProse kicker="Coverage" title="Insurance & protection">
      <p>
        Each Oxour Go vehicle carries comprehensive motor insurance per Indian motor vehicle rules.
        Deductibles and exclusions apply for negligent or prohibited use.
      </p>
      <p>
        Optional protection bundles can reduce out-of-pocket exposure for minor cosmetic damage and
        windshield chips—ask concierge for the latest rate card tied to your specific model.
      </p>
      <p>
        Third-party liability limits follow the issuing insurer&apos;s schedule. For high-value convoys or
        film shoots, bespoke coverage can be arranged with advance notice.
      </p>
      <p>
        Claims must be reported immediately via support hotline. Delayed reporting may void coverage
        under insurer guidelines.
      </p>
    </LegalProse>
  )
}
