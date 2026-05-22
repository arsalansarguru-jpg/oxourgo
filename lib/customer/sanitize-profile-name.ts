/** Role / system labels that must never pre-fill the customer "Full name" field. */
const ROLE_PLACEHOLDER_NAMES = new Set([
  'client',
  'guest',
  'member',
  'customer',
  'user',
  'admin',
  'staff',
  'operator',
  'ops',
  'driver',
  'owner',
])

export function isRolePlaceholderName(value: string | null | undefined): boolean {
  const t = value?.trim().toLowerCase()
  if (!t) return false
  return ROLE_PLACEHOLDER_NAMES.has(t)
}

/** Safe initial value for profile full-name inputs. */
export function initialProfileFullName(
  profileFullName: string | null | undefined,
  metadataFullName: string | null | undefined,
): string {
  if (profileFullName?.trim() && !isRolePlaceholderName(profileFullName)) {
    return profileFullName.trim()
  }
  if (metadataFullName?.trim() && !isRolePlaceholderName(metadataFullName)) {
    return metadataFullName.trim()
  }
  return ''
}
