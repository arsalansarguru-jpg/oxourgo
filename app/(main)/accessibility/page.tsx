import { BRAND } from '@/constants/brand'
import { LegalProse } from '@/components/legal/legal-prose'

export default function AccessibilityPage() {
  return (
    <LegalProse kicker="A11y" title="Accessibility statement">
      <p>
        Oxour Go aims to meet WCAG 2.2 AA for core booking flows. We support keyboard navigation,
        semantic landmarks, and high-contrast dark interfaces tuned for readability on mobile.
      </p>
      <p>
        If you encounter a barrier—screen reader quirks, focus traps, or color contrast issues—please
        email {BRAND.email} with the page URL and device. We prioritize fixes for verified guests.
      </p>
      <p>
        Third-party checkouts (payments, document verification) inherit vendor accessibility postures; we
        pressure partners on roadmap commitments.
      </p>
    </LegalProse>
  )
}
