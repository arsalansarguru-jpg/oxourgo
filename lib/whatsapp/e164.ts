/** Normalize Indian/local numbers to E.164 (+91…) for storage and WhatsApp API. */
export function normalizeToE164(raw: string, defaultCountryCode = '91'): string | null {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null

  if (raw.trim().startsWith('+')) {
    const e164 = `+${digits}`
    return /^\+[1-9][0-9]{7,14}$/.test(e164) ? e164 : null
  }

  if (digits.length === 10) {
    const e164 = `+${defaultCountryCode}${digits}`
    return /^\+[1-9][0-9]{7,14}$/.test(e164) ? e164 : null
  }

  if (digits.length >= 11 && digits.length <= 15) {
    const e164 = `+${digits}`
    return /^\+[1-9][0-9]{7,14}$/.test(e164) ? e164 : null
  }

  return null
}
