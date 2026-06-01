export function kycPreviewNotSupportedMessage(contentType: string | null | undefined): string | null {
  const mime = (contentType ?? '').toLowerCase()
  if (mime.includes('heic') || mime.includes('heif')) {
    return 'This photo uses HEIC format — use Open / download to view it in your browser.'
  }
  if (mime === 'application/octet-stream' || !mime) {
    return 'Preview is unavailable for this file type — use Open / download to verify the document.'
  }
  return null
}

export function isHeicKycContentType(contentType: string | null | undefined): boolean {
  const mime = (contentType ?? '').toLowerCase()
  return mime.includes('heic') || mime.includes('heif')
}

export function isBrowserPreviewableImage(contentType: string | null | undefined): boolean {
  const mime = (contentType ?? '').toLowerCase()
  if (!mime || mime.includes('pdf')) return false
  if (mime.includes('heic') || mime.includes('heif')) return false
  if (mime === 'application/octet-stream') return false
  return mime.startsWith('image/')
}
