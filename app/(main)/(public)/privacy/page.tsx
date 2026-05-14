import { LegalProse } from '@/components/legal/legal-prose'

export default function PrivacyPage() {
  return (
    <LegalProse kicker="Legal" title="Privacy Policy">
      <p>
        We collect identity, payment, and trip data strictly to fulfill rentals, meet regulatory
        obligations, and improve service quality. Biometric or selfie checks are processed by certified
        vendors and retained only as long as legally necessary.
      </p>
      <p>
        We do not sell personal data. Limited subprocessors handle hosting, messaging, and payments under
        data processing agreements with Indian and global safeguards where applicable.
      </p>
      <p>
        You may request access, correction, or deletion where not prohibited by law. Security incidents
        are triaged under a documented response plan with user notification when warranted.
      </p>
      <p>
        Cookies on our marketing site help us understand traffic patterns. See the cookie policy for
        granular controls.
      </p>
    </LegalProse>
  )
}
