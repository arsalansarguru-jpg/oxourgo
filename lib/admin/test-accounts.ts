/** Internal / QA accounts excluded from production-facing KYC queues by default. */
const INTERNAL_EMAIL_PATTERNS = [
  /^oxour\.co@/i,
  /^oxourgo@/i,
  /^test\+/i,
  /^qa\+/i,
  /@oxourgo\.com$/i,
  /@oxour\.co$/i,
]

const INTERNAL_NAME_PATTERNS = [/^oxour$/i, /^test\s*user$/i]

export function isInternalTestAccount(input: {
  email?: string | null
  displayName?: string | null
}): boolean {
  const email = input.email?.trim() ?? ''
  if (email && INTERNAL_EMAIL_PATTERNS.some((re) => re.test(email))) return true

  const name = input.displayName?.trim() ?? ''
  if (name && INTERNAL_NAME_PATTERNS.some((re) => re.test(name))) return true

  return false
}
