/**
 * Canonical business contact details for Oxour Go (public site + notifications).
 * Override via `NEXT_PUBLIC_*` env vars when needed; production defaults below.
 */

/** E.164 digits without `+` — voice + WhatsApp (India). */
export const BUSINESS_PHONE_E164_DIGITS = '919833133343'

/** Same line as voice; `wa.me` path segment. */
export const BUSINESS_WHATSAPP_E164_DIGITS = '919833133343'

export const BUSINESS_SUPPORT_EMAIL = 'hello@oxourgo.com'

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function normalizeIndiaE164Digits(raw: string): string | null {
  const d = digitsOnly(raw)
  if (d.length < 10) return null
  if (d.startsWith('91') && d.length === 12) return d
  if (d.length === 10) return `91${d}`
  if (d.startsWith('91') && d.length > 12) return d.slice(0, 12)
  return d.length >= 12 ? d : null
}

function readEnvDigits(): string | null {
  if (typeof process === 'undefined') return null
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_E164?.trim() ||
    process.env.NEXT_PUBLIC_BUSINESS_PHONE_E164?.trim()
  if (!raw) return null
  return normalizeIndiaE164Digits(raw)
}

/** E.164 digits without `+` (env override, else production default). */
export function getBusinessPhoneE164Digits(): string {
  return readEnvDigits() ?? BUSINESS_PHONE_E164_DIGITS
}

/** WhatsApp Business line — same number as voice unless env overrides. */
export function getBusinessWhatsAppE164Digits(): string {
  return getBusinessPhoneE164Digits()
}

/** `tel:` href value, e.g. `+919833133343`. */
export function getBusinessPhoneTel(): string {
  return `+${getBusinessPhoneE164Digits()}`
}

/** Human-readable phone, e.g. `+91 98331 33343`. */
export function getBusinessPhoneDisplay(): string {
  const override =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_BUSINESS_PHONE_DISPLAY?.trim() : undefined
  if (override) return override
  const d = getBusinessPhoneE164Digits()
  if (d.length === 12 && d.startsWith('91')) {
    return `+91 ${d.slice(2, 7)} ${d.slice(7)}`
  }
  return `+${d}`
}

/** Support / concierge inbox. */
export function getBusinessSupportEmail(): string {
  const override =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_BUSINESS_SUPPORT_EMAIL?.trim() : undefined
  return override || BUSINESS_SUPPORT_EMAIL
}

const DEFAULT_WHATSAPP_PREFILL = "Hi Oxour Go, I'd like to book a luxury self-drive in Mumbai."

export type VehicleInquiryContext = {
  vehicleName?: string | null
  tripFrom?: string | null
  tripTo?: string | null
  pickupHub?: string | null
}

/** Prefilled WhatsApp message for a specific vehicle / trip context. */
export function getVehicleInquiryWhatsAppUrl(context?: VehicleInquiryContext): string {
  const name = context?.vehicleName?.trim()
  const parts = [
    name
      ? `Hi Oxour Go, I'm interested in the ${name} for a self-drive in Mumbai.`
      : "Hi Oxour Go, I'm interested in a vehicle from your fleet for a self-drive in Mumbai.",
  ]
  if (context?.pickupHub?.trim()) parts.push(`Preferred hub: ${context.pickupHub.trim()}.`)
  if (context?.tripFrom?.trim() && context?.tripTo?.trim()) {
    parts.push(`Dates: ${context.tripFrom.trim()} to ${context.tripTo.trim()}.`)
  }
  parts.push('Please share availability and next steps.')
  return getBusinessWhatsAppUrl(parts.join(' '))
}

/** Public WhatsApp deep link (`wa.me`). */
export function getBusinessWhatsAppUrl(prefillText?: string): string {
  const d = getBusinessWhatsAppE164Digits()
  const base = `https://wa.me/${d}`
  const text = prefillText?.trim() || DEFAULT_WHATSAPP_PREFILL
  return `${base}?text=${encodeURIComponent(text)}`
}

/** Stable snapshot for UI shells (footer, nav, metadata). */
export function getBusinessContact() {
  return {
    phoneE164Digits: getBusinessPhoneE164Digits(),
    whatsappE164Digits: getBusinessWhatsAppE164Digits(),
    phoneTel: getBusinessPhoneTel(),
    phoneDisplay: getBusinessPhoneDisplay(),
    supportEmail: getBusinessSupportEmail(),
    whatsappUrl: getBusinessWhatsAppUrl(),
  } as const
}
