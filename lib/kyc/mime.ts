/** MIME types accepted for KYC ID tiles (images + PDF). */
const KYC_ID_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
])

/** MIME types accepted for selfie tiles. */
const KYC_SELFIE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  pdf: 'application/pdf',
}

function extensionFromFilename(name: string): string {
  const parts = name.split('.')
  if (parts.length < 2) return ''
  return (parts.pop() ?? '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}

/**
 * Resolves a storage Content-Type for uploads. Mobile browsers (especially Safari) often
 * leave `file.type` empty for camera roll / Files picks.
 */
export function inferKycContentType(file: File): string {
  const trimmed = file.type?.trim()
  if (trimmed && trimmed !== 'application/octet-stream') return trimmed

  const ext = extensionFromFilename(file.name)
  if (ext && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext]

  if (file.name.toLowerCase().endsWith('.pdf')) return 'application/pdf'
  return 'application/octet-stream'
}

export function extensionForKycUpload(file: File): string {
  const fromName = extensionFromFilename(file.name)
  if (fromName) return fromName

  const mime = inferKycContentType(file)
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/heic') return 'heic'
  if (mime === 'image/heif') return 'heif'
  if (mime === 'application/pdf') return 'pdf'
  return 'bin'
}

export function isAllowedKycMime(mime: string, selfie: boolean): boolean {
  if (selfie) return KYC_SELFIE_MIMES.has(mime) || mime.startsWith('image/')
  return KYC_ID_MIMES.has(mime) || mime.startsWith('image/')
}
