import Link from 'next/link'

import { BRAND } from '@/constants/brand'
import { LegalProse } from '@/components/legal/legal-prose'
import { Button } from '@/components/ui/Button'

export default function AboutPage() {
  return (
    <LegalProse kicker="Company" title="Built for Mumbai’s premium mile">
      <p>
        Oxour Go is a mobility-tech platform focused on verified self-drive luxury and premium vehicles
        across Mumbai. We pair transparent pricing with concierge-grade support so every trip feels
        composed, calm, and certain.
      </p>
      <p>
        Our operations team inspects each vehicle on a 120-point checklist, syncs hub staffing to
        flight and event windows, and keeps you informed with proactive WhatsApp updates.
      </p>
      <p>
        Whether you are closing deals in BKC or hosting guests for a weekend coastal run, we believe the
        car should disappear into the background—quiet, immaculate, and ready.
      </p>
      <p>
        Explore the{' '}
        <Link href="/fleet" className="text-electric hover:underline">
          fleet
        </Link>
        , read{' '}
        <Link href="/insurance" className="text-electric hover:underline">
          insurance
        </Link>{' '}
        details, or talk to{' '}
        <Link href="/support" className="text-electric hover:underline">
          support
        </Link>
        .
      </p>
      <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-center">
        <Button size="lg" to="/fleet">
          Browse the fleet
        </Button>
        <Button size="lg" variant="secondary" href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer">
          WhatsApp concierge
        </Button>
      </div>
    </LegalProse>
  )
}
