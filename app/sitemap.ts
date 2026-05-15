import type { MetadataRoute } from 'next'

import { destinations } from '@/data/destinations'
import { getSiteUrl } from '@/lib/env/site-url'
import { getFleetCars } from '@/lib/fleet/get-fleet-cars'

export const revalidate = 600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${siteUrl}/fleet`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${siteUrl}/support`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${siteUrl}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.35 },
    { url: `${siteUrl}/insurance`, lastModified: now, changeFrequency: 'yearly', priority: 0.45 },
    { url: `${siteUrl}/refund`, lastModified: now, changeFrequency: 'yearly', priority: 0.45 },
    { url: `${siteUrl}/accessibility`, lastModified: now, changeFrequency: 'yearly', priority: 0.45 },
    { url: `${siteUrl}/careers`, lastModified: now, changeFrequency: 'monthly', priority: 0.55 },
  ]

  const destinationEntries: MetadataRoute.Sitemap = destinations.map((d) => ({
    url: `${siteUrl}/destinations/${d.id}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }))

  const { cars } = await getFleetCars()
  const vehicleEntries: MetadataRoute.Sitemap = cars.map((car) => ({
    url: `${siteUrl}/car/${car.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  return [...staticRoutes, ...destinationEntries, ...vehicleEntries]
}
