import { LegalProse } from '@/components/legal/legal-prose'

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
