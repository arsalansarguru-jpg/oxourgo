import { BRAND } from '@/constants/brand'
import { LegalProse } from '@/components/legal/legal-prose'
import { Button } from '@/components/ui/Button'

export default function CareersPage() {
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
        <Button href={`mailto:${BRAND.email}?subject=Careers%20at%20Oxour%20Go`}>
          Email careers
        </Button>
      </div>
    </LegalProse>
  )
}
