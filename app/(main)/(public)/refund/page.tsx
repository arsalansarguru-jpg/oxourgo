import type { Metadata } from 'next'

import { LegalProse } from '@/components/legal/legal-prose'
import { buildPageMetadata } from '@/lib/seo/build-page-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Refund policy',
  description:
    'Oxour Go cancellation windows, refund timelines, security deposit holds, and no-show policy for Mumbai self-drive bookings.',
  path: '/refund',
  keywords: ['Oxour Go refund', 'cancellation policy', 'deposit release'],
})

export default function RefundPage() {
  return (
    <LegalProse kicker="Legal" title="Refund Policy">
      <p>
        Cancellations more than 48 hours before pickup receive a full refund of prepaid rental amounts
        to the original instrument, typically within 7 business days.
      </p>
      <p>
        Cancellations within 48 hours may incur a same-day detailing and staffing fee up to one day&apos;s
        rental, clearly itemized on your invoice.
      </p>
      <p>
        Security deposits are not charges—they are pre-authorizations. If a hold remains beyond 7
        banking days after return, contact support with your bank&apos;s ARN for expedited tracing.
      </p>
      <p>
        No-show: failure to arrive within the grace window without notice may forfeit the booking value
        and impact future priority access.
      </p>
    </LegalProse>
  )
}
