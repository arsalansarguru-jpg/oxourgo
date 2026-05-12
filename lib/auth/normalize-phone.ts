/**
 * Normalize user-entered Indian (or international) numbers to E.164 for Supabase Phone Auth.
 * Returns null if the value cannot be interpreted safely.
 */
export function normalizePhoneToE164(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, ' ')
  const digitsOnly = raw.replace(/\D/g, '')

  if (trimmed.startsWith('+')) {
    const compact = trimmed.replace(/[\s()-]/g, '')
    if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact
    return null
  }

  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`
  }

  if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
    return `+${digitsOnly}`
  }

  if (digitsOnly.startsWith('0') && digitsOnly.length === 11 && digitsOnly[1] !== '0') {
    return `+91${digitsOnly.slice(1)}`
  }

  return null
}
