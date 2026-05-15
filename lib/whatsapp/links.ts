import { BUSINESS_WHATSAPP_URL } from '@/lib/constants'

const WA_ME = /wa\.me\/(\d+)/i

/** Digits-only path segment after `wa.me/` from the configured business URL. */
export function getWhatsAppBusinessDigits(url: string = BUSINESS_WHATSAPP_URL): string {
  const envDigits = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_E164?.trim() : undefined
  if (envDigits && /^\d{8,15}$/.test(envDigits)) return envDigits
  const m = url.match(WA_ME)
  return m?.[1] ?? '912200000000'
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
  return BUSINESS_WHATSAPP_URL
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
