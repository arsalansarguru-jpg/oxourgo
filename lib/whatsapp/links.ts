import { getBusinessPhoneE164Digits, getBusinessWhatsAppUrl } from '@/lib/business-contact'

/** Digits-only path segment after `wa.me/`. */
export function getWhatsAppBusinessDigits(): string {
  return getBusinessPhoneE164Digits()
}

/**
 * Opens WhatsApp with a prefilled message (keep under ~500 chars for client compatibility).
 */
export function buildWhatsAppPrefilledUrl(message: string, digits?: string): string {
  const d = digits ?? getWhatsAppBusinessDigits()
  const text = message.trim().slice(0, 480)
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`
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
    `Dashboard: ${params.siteUrl}/dashboard/bookings/${params.bookingId}`,
  ].filter(Boolean) as string[]
  return lines.join(' ')
}

export function tripReminderPrefilledMessage(params: {
  bookingId: string
  siteUrl: string
  carLabel: string
  whenSummary: string
}): string {
  return [
    `Hi Oxour Go — quick note on my upcoming trip (${params.carLabel}, ${params.whenSummary}).`,
    `Booking: ${params.siteUrl}/dashboard/bookings/${params.bookingId}`,
  ].join(' ')
}

export function returnReminderPrefilledMessage(params: {
  bookingId: string
  siteUrl: string
  carLabel: string
  returnSummary: string
}): string {
  return [
    `Hi Oxour Go — coordinating return for ${params.carLabel} (${params.returnSummary}).`,
    `Booking: ${params.siteUrl}/dashboard/bookings/${params.bookingId}`,
  ].join(' ')
}
