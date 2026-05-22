/**
 * Canonical customer display name resolution for admin + dashboard surfaces.
 */

export type CustomerNameInput = {
  userId: string
  fullName?: string | null
  displayName?: string | null
  email?: string | null
  phone?: string | null
  authMetadata?: { full_name?: string; name?: string; display_name?: string } | null
}

function fromMetadata(meta: CustomerNameInput['authMetadata']): string | null {
  if (!meta) return null
  const n =
    meta.full_name?.trim() || meta.display_name?.trim() || meta.name?.trim() || null
  return n
}

function fromEmailLocal(email: string): string | null {
  const local = email.split('@')[0]?.trim()
  if (!local || local.length < 2) return null
  const pretty = local.replace(/[._+-]+/g, ' ').trim()
  if (!pretty) return null
  return pretty.charAt(0).toUpperCase() + pretty.slice(1)
}

/** Best-effort display name — never returns generic placeholders like "Client" or "Guest". */
export function resolveCustomerDisplayName(input: CustomerNameInput): string {
  const full = input.fullName?.trim()
  if (full) return full

  const display = input.displayName?.trim()
  if (display) return display

  const meta = fromMetadata(input.authMetadata)
  if (meta) return meta

  const email = input.email?.trim()
  if (email) {
    const fromLocal = fromEmailLocal(email)
    if (fromLocal) return fromLocal
    return email
  }

  const phone = input.phone?.trim()
  if (phone) return phone

  return `Customer ${input.userId.slice(0, 8).toUpperCase()}`
}
