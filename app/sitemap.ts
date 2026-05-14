import type { MetadataRoute } from 'next'

import { destinations } from '@/data/destinations'
import { getFleetCars } from '@/lib/fleet/get-fleet-cars'
import { getMetadataSiteUrl } from '@/lib/seo/site-metadata'

export const revalidate = 600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getMetadataSiteUrl()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/fleet`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${base}/support`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.35 },
    { url: `${base}/insurance`, lastModified: now, changeFrequency: 'yearly', priority: 0.45 },
    { url: `${base}/refund`, lastModified: now, changeFrequency: 'yearly', priority: 0.45 },
    { url: `${base}/accessibility`, lastModified: now, changeFrequency: 'yearly', priority: 0.45 },
    { url: `${base}/careers`, lastModified: now, changeFrequency: 'monthly', priority: 0.55 },
  ]

  const destinationEntries: MetadataRoute.Sitemap = destinations.map((d) => ({
    url: `${base}/destinations/${d.id}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }))

  const { cars } = await getFleetCars()
  const vehicleEntries: MetadataRoute.Sitemap = cars.map((car) => ({
    url: `${base}/car/${car.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  return [...staticRoutes, ...destinationEntries, ...vehicleEntries]
}
