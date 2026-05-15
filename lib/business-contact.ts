/**
 * Concierge phone & WhatsApp — set `NEXT_PUBLIC_WHATSAPP_BUSINESS_E164` (digits, e.g. 9198XXXXXXXX).
 * Optional `NEXT_PUBLIC_BUSINESS_PHONE_DISPLAY` overrides formatted display.
 */

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/** E.164 digits without + (defaults to env or Mumbai concierge placeholder for dev). */
export function getBusinessPhoneE164Digits(): string {
  const raw =
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_E164?.trim() : undefined) ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_BUSINESS_PHONE_E164?.trim() : undefined)
  const d = raw ? digitsOnly(raw) : ''
  if (d.length >= 10) return d.startsWith('91') && d.length === 12 ? d : d.length === 10 ? `91${d}` : d
  return '919829012345'
}

export function getBusinessPhoneTel(): string {
  return `+${getBusinessPhoneE164Digits()}`
}

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

export function getBusinessWhatsAppUrl(prefillText?: string): string {
  const d = getBusinessPhoneE164Digits()
  const base = `https://wa.me/${d}`
  if (!prefillText?.trim()) {
    return `${base}?text=${encodeURIComponent("Hi Oxour Go, I'd like to book a luxury self-drive in Mumbai.")}`
  }
  return `${base}?text=${encodeURIComponent(prefillText)}`
}
