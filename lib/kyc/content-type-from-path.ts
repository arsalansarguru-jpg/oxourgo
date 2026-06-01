/** Infer MIME from vault object path when DB content_type is missing or wrong. */
export function inferKycContentTypeFromPath(storagePath: string): string | null {
  const ext = storagePath.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? ''
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    pdf: 'application/pdf',
  }
  return map[ext] ?? null
}

export function resolveKycPreviewContentType(
  storagePath: string,
  storedContentType: string | null | undefined,
): string | null {
  const stored = storedContentType?.trim() || null
  if (stored && stored !== 'application/octet-stream') return stored
  return inferKycContentTypeFromPath(storagePath)
}
