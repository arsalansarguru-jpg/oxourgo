import type { Metadata } from 'next'

import { getMetadataSiteUrl } from '@/lib/seo/site-metadata'
import { SITE_KEYWORDS_BASE } from '@/lib/seo/site-keywords'

export type BuildPageMetadataInput = {
  title: string
  description: string
  /** Path only, e.g. `/fleet` or `/car/abc` (query stripped for canonical). */
  path: string
  keywords?: readonly string[]
  /** Absolute or site-root path for OG/Twitter; omit to use default `/opengraph-image`. */
  ogImage?: string | null
  ogType?: 'website' | 'article'
  robots?: Metadata['robots']
}

function mergeKeywords(extra?: readonly string[]): string[] {
  const set = new Set<string>([...SITE_KEYWORDS_BASE, ...(extra ?? [])])
  return [...set].slice(0, 24)
}

function absoluteUrl(base: string, pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  const p = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${base}${p}`
}

/**
 * Consistent marketing metadata: canonical, Open Graph, Twitter, keywords.
 * Fleet filtered views should pass `path` without query so canonical stays `/fleet`.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  ogImage,
  ogType = 'website',
  robots,
}: BuildPageMetadataInput): Metadata {
  const base = getMetadataSiteUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const pathNoQuery = normalizedPath.split('?')[0]
  const canonical = `${base}${pathNoQuery}`
  const ogPageUrl = `${base}${normalizedPath.split('?')[0]}`

  const defaultOg = `${base}/opengraph-image`
  const imageUrl = ogImage ? absoluteUrl(base, ogImage) : defaultOg

  return {
    title,
    description,
    keywords: mergeKeywords(keywords),
    alternates: {
      canonical,
    },
    openGraph: {
      type: ogType,
      locale: 'en_IN',
      url: ogPageUrl,
      siteName: 'Oxour Go',
      title,
      description,
      images: [{ url: imageUrl, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: robots ?? { index: true, follow: true },
  }
}
