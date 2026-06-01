export function kycPreviewNotSupportedMessage(contentType: string | null | undefined): string | null {
  const mime = (contentType ?? '').toLowerCase()
  if (mime.includes('heic') || mime.includes('heif')) {
    return 'This photo uses HEIC format — use Open / download to view it in your browser.'
  }
  return null
}

export function isHeicKycContentType(contentType: string | null | undefined): boolean {
  const mime = (contentType ?? '').toLowerCase()
  return mime.includes('heic') || mime.includes('heif')
}
