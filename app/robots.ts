import type { MetadataRoute } from 'next'

import { getSiteUrl } from '@/lib/env/site-url'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/api/', '/login', '/booking/', '/supabase-test'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
