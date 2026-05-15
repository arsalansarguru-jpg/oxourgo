import { getBusinessWhatsAppUrl } from '@/lib/business-contact'

/** @deprecated Prefer {@link getBusinessWhatsAppUrl}; digits kept for backwards compatibility. */
export function getWhatsAppBusinessDigits(): string {
  return '919833133343'
}

/**
 * Opens WhatsApp with a prefilled message (keep under ~500 chars for client compatibility).
 */
export function buildWhatsAppPrefilledUrl(message: string): string {
  return getBusinessWhatsAppUrl(message.trim().slice(0, 480))
}

export function conciergeWhatsAppUrl(): string {
  return getBusinessWhatsAppUrl()
}

export function bookingSupportPrefilledMessage(params: {
  bookingId: string
  /** Public site origin, no trailing slash */
  siteUrl: string
  carLabel?: string | null
  pickupSummary?: string
}): string {
  const ref = params.bookingId.replace(/-/g, '').slice(0, 10).toUpperCase()
  const lines = [
    `Hi Oxour Go — regarding my booking (ref ${ref}).`,
    params.carLabel ? `Vehicle: ${params.carLabel}.` : undefined,
    params.pickupSummary ? `Pickup: ${params.pickupSummary}.` : undefined,
    `Please reply here with next steps.`,
  ].filter(Boolean) as string[]
  return lines.join(' ')
}

export function tripReminderPrefilledMessage(params: {
  bookingId: string
  siteUrl: string
  carLabel: string
  whenSummary: string
}): string {
  const ref = params.bookingId.replace(/-/g, '').slice(0, 10).toUpperCase()
  return [
    `Hi Oxour Go — pickup reminder for ${params.carLabel} (${params.whenSummary}).`,
    `Booking ref ${ref}.`,
  ].join(' ')
}

export function returnReminderPrefilledMessage(params: {
  bookingId: string
  siteUrl: string
  carLabel: string
  returnSummary: string
}): string {
  const ref = params.bookingId.replace(/-/g, '').slice(0, 10).toUpperCase()
  return [
    `Hi Oxour Go — coordinating return for ${params.carLabel} (${params.returnSummary}).`,
    `Booking ref ${ref}.`,
  ].join(' ')
}
