import type { Metadata } from 'next'

import { BRAND } from '@/constants/brand'
import { LegalProse } from '@/components/legal/legal-prose'
import { Button } from '@/components/ui/Button'
import { buildPageMetadata } from '@/lib/seo/build-page-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Careers',
  description:
    'Join Oxour Go — operations, fleet, and engineering roles building premium self-drive luxury mobility in Mumbai.',
  path: '/careers',
  keywords: ['Oxour Go careers', 'Mumbai mobility jobs', 'luxury fleet operations'],
})

export default function CareersPage() {
  const subject = encodeURIComponent('Careers at Oxour Go')
  const body = encodeURIComponent(
    [
      'Hi Oxour Go team,',
      '',
      'I would like to express interest in joining Oxour Go.',
      '',
      'Role focus:',
      'Relevant experience (2–3 sentences):',
      'Portfolio / GitHub / LinkedIn:',
      '',
      'Thank you,',
    ].join('\n'),
  )

  return (
    <LegalProse kicker="Join us" title="Careers at Oxour Go">
      <p>
        We are building a small, elite team across operations, fleet science, and product design. If you
        obsess over craft and calm customer experiences, you will fit right in.
      </p>
      <p>
        Open roles include Mumbai hub leads, automotive detailers with EV experience, and full-stack
        engineers comfortable with regulated marketplaces.
      </p>
      <p>
        Send a concise note and portfolio or GitHub to our talent inbox—we read every message.
      </p>
      <div className="pt-4">
        <Button href={`mailto:${BRAND.email}?subject=${subject}&body=${body}`}>
          Email careers
        </Button>
      </div>
    </LegalProse>
  )
}
