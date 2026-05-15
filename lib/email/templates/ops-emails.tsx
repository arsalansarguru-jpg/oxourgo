import * as React from 'react'
import { Text } from '@react-email/components'

import { EmailPrimaryButton, OxourEmailLayout } from '@/lib/email/templates/oxour-email-layout'
import { emailTheme } from '@/lib/email/theme'

function bodyStyle(): React.CSSProperties {
  return { margin: 0, fontSize: '15px', lineHeight: 1.65, color: emailTheme.soft }
}

export type OpsNewBookingProps = {
  pickupSummary: string
  carLabel: string | null
  adminBookingUrl: string
}

export function OpsNewBookingEmail({ pickupSummary, carLabel, adminBookingUrl }: OpsNewBookingProps) {
  return (
    <OxourEmailLayout preview="New booking pending review — Oxour Go Ops">
      <Text style={bodyStyle()}>
        A new reservation is awaiting review. {carLabel ? `${carLabel} · ` : ''}
        Pickup {pickupSummary}.
      </Text>
      <EmailPrimaryButton href={adminBookingUrl} label="Review in admin" />
    </OxourEmailLayout>
  )
}

export type OpsKycSubmissionProps = {
  documentTypeLabel: string
  adminKycUrl: string
}

export function OpsKycSubmissionEmail({ documentTypeLabel, adminKycUrl }: OpsKycSubmissionProps) {
  return (
    <OxourEmailLayout preview="KYC submission — Oxour Go Ops">
      <Text style={bodyStyle()}>
        A customer uploaded a new {documentTypeLabel} document for verification.
      </Text>
      <EmailPrimaryButton href={adminKycUrl} label="Open KYC queue" />
    </OxourEmailLayout>
  )
}

export type OpsBookingCancellationProps = {
  pickupSummary: string
  carLabel: string | null
  note: string | null
  adminBookingUrl: string
}

export function OpsBookingCancellationEmail({
  pickupSummary,
  carLabel,
  note,
  adminBookingUrl,
}: OpsBookingCancellationProps) {
  return (
    <OxourEmailLayout preview="Booking cancelled — Oxour Go Ops">
      <Text style={bodyStyle()}>
        A booking was cancelled or rejected. {carLabel ? `${carLabel} · ` : ''}
        Pickup {pickupSummary}.
        {note ? ` Note: ${note}` : ''}
      </Text>
      <EmailPrimaryButton href={adminBookingUrl} label="View booking" />
    </OxourEmailLayout>
  )
}
