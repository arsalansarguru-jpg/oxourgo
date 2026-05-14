import type { MetadataRoute } from 'next'

import { getMetadataSiteUrl } from '@/lib/seo/site-metadata'

export default function robots(): MetadataRoute.Robots {
  const base = getMetadataSiteUrl()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/api/', '/login', '/booking/', '/supabase-test'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/\/+$/, ''),
  }
}
