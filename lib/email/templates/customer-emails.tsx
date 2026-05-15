import * as React from 'react'
import { Text } from '@react-email/components'

import { EmailMutedRule, EmailPrimaryButton, OxourEmailLayout } from '@/lib/email/templates/oxour-email-layout'
import { emailTheme } from '@/lib/email/theme'

function bodyStyle(): React.CSSProperties {
  return { margin: 0, fontSize: '15px', lineHeight: 1.65, color: emailTheme.soft }
}

export type CustomerBookingConfirmationProps = {
  firstName: string | null
  carLabel: string | null
  pickupSummary: string
  dashboardUrl: string
  whatsAppUrl: string
}

export function CustomerBookingConfirmationEmail({
  firstName,
  carLabel,
  pickupSummary,
  dashboardUrl,
  whatsAppUrl,
}: CustomerBookingConfirmationProps) {
  const greet = firstName?.trim() ? `${firstName.trim()},` : 'Hello,'
  return (
    <OxourEmailLayout preview="Your Oxour Go reservation is received.">
      <Text style={bodyStyle()}>
        {greet}
        <br />
        <br />
        Thank you for choosing Oxour Go. We have received your reservation
        {carLabel ? ` for ${carLabel}` : ''}. Pickup is scheduled for {pickupSummary}. Our concierge will review the
        request shortly; payment will be due once the booking is approved.
      </Text>
      <EmailPrimaryButton href={dashboardUrl} label="View booking" />
      <EmailMutedRule />
      <Text style={{ ...bodyStyle(), fontSize: '14px', color: emailTheme.muted }}>
        Prefer WhatsApp?{' '}
        <a href={whatsAppUrl} style={{ color: emailTheme.electric }}>
          Message the concierge
        </a>{' '}
        with this booking open on your phone.
      </Text>
    </OxourEmailLayout>
  )
}

export type CustomerBookingApprovedProps = {
  firstName: string | null
  carLabel: string | null
  pickupSummary: string
  dashboardUrl: string
  whatsAppUrl: string
}

export function CustomerBookingApprovedEmail({
  firstName,
  carLabel,
  pickupSummary,
  dashboardUrl,
  whatsAppUrl,
}: CustomerBookingApprovedProps) {
  const greet = firstName?.trim() ? `${firstName.trim()},` : 'Hello,'
  return (
    <OxourEmailLayout preview="Your Oxour Go trip is approved.">
      <Text style={bodyStyle()}>
        {greet}
        <br />
        <br />
        Your reservation is approved{carLabel ? ` — ${carLabel}` : ''}. Pickup: {pickupSummary}. We will guide you through
        payment and handover from your dashboard.
      </Text>
      <EmailPrimaryButton href={dashboardUrl} label="Open dashboard" />
      <EmailMutedRule />
      <Text style={{ ...bodyStyle(), fontSize: '14px', color: emailTheme.muted }}>
        <a href={whatsAppUrl} style={{ color: emailTheme.electric }}>
          WhatsApp concierge
        </a>{' '}
        for last-minute coordination.
      </Text>
    </OxourEmailLayout>
  )
}

export type CustomerBookingRejectedProps = {
  firstName: string | null
  carLabel: string | null
  note: string | null
  fleetUrl: string
}

export function CustomerBookingRejectedEmail({ firstName, carLabel, note, fleetUrl }: CustomerBookingRejectedProps) {
  const greet = firstName?.trim() ? `${firstName.trim()},` : 'Hello,'
  return (
    <OxourEmailLayout preview="Update on your Oxour Go booking request.">
      <Text style={bodyStyle()}>
        {greet}
        <br />
        <br />
        We were not able to approve this request{carLabel ? ` for ${carLabel}` : ''}.
        {note ? ` Note from operations: ${note}` : ' Please choose another vehicle or adjust your dates.'}
      </Text>
      <EmailPrimaryButton href={fleetUrl} label="Browse fleet" />
    </OxourEmailLayout>
  )
}

export type CustomerTripReminderProps = {
  firstName: string | null
  carLabel: string
  whenSummary: string
  dashboardUrl: string
  whatsAppUrl: string
}

export function CustomerTripReminderEmail({
  firstName,
  carLabel,
  whenSummary,
  dashboardUrl,
  whatsAppUrl,
}: CustomerTripReminderProps) {
  const greet = firstName?.trim() ? `${firstName.trim()},` : 'Hello,'
  return (
    <OxourEmailLayout preview="Your Oxour Go pickup is coming up.">
      <Text style={bodyStyle()}>
        {greet} your handover for {carLabel} is approaching ({whenSummary}). Have your license and booking reference ready.
      </Text>
      <EmailPrimaryButton href={dashboardUrl} label="Trip details" />
      <Text style={{ ...bodyStyle(), fontSize: '14px', color: emailTheme.muted, marginTop: '16px' }}>
        <a href={whatsAppUrl} style={{ color: emailTheme.electric }}>
          WhatsApp us
        </a>{' '}
        for runway changes or concierge support.
      </Text>
    </OxourEmailLayout>
  )
}

export type CustomerReturnReminderProps = {
  firstName: string | null
  carLabel: string
  returnSummary: string
  dashboardUrl: string
  whatsAppUrl: string
}

export function CustomerReturnReminderEmail({
  firstName,
  carLabel,
  returnSummary,
  dashboardUrl,
  whatsAppUrl,
}: CustomerReturnReminderProps) {
  const greet = firstName?.trim() ? `${firstName.trim()},` : 'Hello,'
  return (
    <OxourEmailLayout preview="Return window — Oxour Go">
      <Text style={bodyStyle()}>
        {greet} the scheduled return for {carLabel} is {returnSummary}. Reply on WhatsApp if you need an extension or
        curbside assistance.
      </Text>
      <EmailPrimaryButton href={dashboardUrl} label="Return checklist" />
      <Text style={{ ...bodyStyle(), fontSize: '14px', color: emailTheme.muted, marginTop: '16px' }}>
        <a href={whatsAppUrl} style={{ color: emailTheme.electric }}>
          Message concierge
        </a>
      </Text>
    </OxourEmailLayout>
  )
}

export type CustomerTripCompletedProps = {
  firstName: string | null
  dashboardUrl: string
  whatsAppUrl: string
}

export function CustomerTripCompletedEmail({ firstName, dashboardUrl, whatsAppUrl }: CustomerTripCompletedProps) {
  const greet = firstName?.trim() ? `${firstName.trim()},` : 'Hello,'
  return (
    <OxourEmailLayout preview="Thank you for driving with Oxour Go.">
      <Text style={bodyStyle()}>
        {greet} your trip is complete. Thank you for trusting Oxour Go — we would be honoured to host you again.
      </Text>
      <EmailPrimaryButton href={dashboardUrl} label="Book again" />
      <Text style={{ ...bodyStyle(), fontSize: '14px', color: emailTheme.muted, marginTop: '16px' }}>
        Feedback or receipts?{' '}
        <a href={whatsAppUrl} style={{ color: emailTheme.electric }}>
          WhatsApp
        </a>
      </Text>
    </OxourEmailLayout>
  )
}

export type CustomerInvoiceAttachedProps = {
  firstName: string | null
  invoiceRef: string
  dashboardUrl: string
}

export function CustomerInvoiceAttachedEmail({ firstName, invoiceRef, dashboardUrl }: CustomerInvoiceAttachedProps) {
  const greet = firstName?.trim() ? `${firstName.trim()},` : 'Hello,'
  return (
    <OxourEmailLayout preview="Your rental invoice from Oxour Go">
      <Text style={bodyStyle()}>
        {greet} please find your itemized rental invoice attached (reference {invoiceRef}). Totals reflect the completed
        trip in your dashboard.
      </Text>
      <EmailPrimaryButton href={dashboardUrl} label="View booking" />
    </OxourEmailLayout>
  )
}
