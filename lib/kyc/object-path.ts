import type { KycDocumentTypeId } from '@/lib/kyc/constants'
import { extensionForKycUpload } from '@/lib/kyc/mime'

/**
 * Private `kyc` bucket path: `<auth.uid()>/<document-type>-<timestamp>.<ext>`
 * First segment must equal `auth.uid()` for storage RLS (`split_part(name, '/', 1)`).
 */
export function buildKycObjectPath(userId: string, documentType: KycDocumentTypeId, file: File): string {
  const ext = extensionForKycUpload(file)
  const stamp = Date.now()
  return `${userId}/${documentType}-${stamp}.${ext}`
}

/** Validates client-reported path matches the authenticated user prefix. */
export function isKycObjectPathForUser(storagePath: string, userId: string): boolean {
  const normalized = storagePath.replace(/^\/+/, '')
  return normalized.startsWith(`${userId}/`) && !normalized.includes('..')
}
