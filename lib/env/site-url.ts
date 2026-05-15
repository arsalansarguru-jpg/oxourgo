/** Canonical public site origin (sitemap, robots, metadataBase, OG, emails, PDFs). */
export function getSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.oxourgo.com'
  return siteUrl.replace(/\/+$/, '')
}

/** @deprecated Prefer {@link getSiteUrl}. */
export function getPublicSiteUrl(): string {
  return getSiteUrl()
}
