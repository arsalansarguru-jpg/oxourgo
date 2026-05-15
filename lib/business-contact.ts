/**
 * Canonical business contact details for Oxour Go (public site + notifications).
 * Override via `NEXT_PUBLIC_*` env vars when needed; production defaults below.
 */

/** E.164 digits without `+` — voice + WhatsApp (India). */
export const BUSINESS_PHONE_E164_DIGITS = '919833133343'

/** Same line as voice; `wa.me` path segment. */
export const BUSINESS_WHATSAPP_E164_DIGITS = '919833133343'

/** Fixed concierge entry — requirements specify this exact origin for CTAs. */
export const CONCIERGE_WHATSAPP_ME = 'https://wa.me/919833133343'

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

const DEFAULT_WHATSAPP_PREFILL = 'Hi Oxour Go, I want to book a luxury self-drive in Mumbai.'

export type VehicleInquiryContext = {
  vehicleName?: string | null
  tripFrom?: string | null
  tripTo?: string | null
  pickupHub?: string | null
}

/** Prefilled booking message for concierge (vehicle + optional trip dates). */
export function buildConciergeBookingPrefill(context?: VehicleInquiryContext): string {
  const rawName = context?.vehicleName?.trim()
  const displayName = rawName && rawName.length > 0 ? rawName : 'a vehicle from your fleet'
  const from = context?.tripFrom?.trim()
  const to = context?.tripTo?.trim()

  let core: string
  if (from && to) {
    core = `Hi Oxour Go, I want to book the ${displayName} from ${from} to ${to}.`
  } else if (from) {
    core = `Hi Oxour Go, I want to book the ${displayName} from ${from}. Please help me choose a return date.`
  } else if (rawName) {
    core = `Hi Oxour Go, I want to book the ${rawName}. Please share available dates.`
  } else {
    core = DEFAULT_WHATSAPP_PREFILL
  }

  const hub = context?.pickupHub?.trim()
  if (hub) {
    return `${core} Preferred hub: ${hub}.`
  }
  return core
}

/** Vehicle-aware concierge URL (`wa.me` + encoded prefill). */
export function getVehicleInquiryWhatsAppUrl(context?: VehicleInquiryContext): string {
  return getBusinessWhatsAppUrl(buildConciergeBookingPrefill(context))
}

/** Alias — booking CTAs on dashboards and marketing. */
export function getConciergeBookingWhatsAppUrl(context?: VehicleInquiryContext): string {
  return getVehicleInquiryWhatsAppUrl(context)
}

/** Public WhatsApp deep link (`wa.me`); always uses {@link CONCIERGE_WHATSAPP_ME}. */
export function getBusinessWhatsAppUrl(prefillText?: string): string {
  const text = (prefillText?.trim() || DEFAULT_WHATSAPP_PREFILL).slice(0, 480)
  return `${CONCIERGE_WHATSAPP_ME}?text=${encodeURIComponent(text)}`
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
