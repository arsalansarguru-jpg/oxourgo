import type { Destination } from '@/data/destinations'

export function buildDestinationJsonLd(destination: Destination, siteUrl: string) {
  const base = siteUrl.replace(/\/+$/, '')
  const pageUrl = `${base}/destinations/${destination.id}`
  const fleetUrl = `${base}/fleet?location=${encodeURIComponent(destination.fleetLocationQuery)}`

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: destination.title,
    description: destination.description,
    url: pageUrl,
    touristType: 'Leisure and business travelers',
    containedInPlace: {
      '@type': 'City',
      name: 'Mumbai',
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: 'Maharashtra',
      },
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `Self-drive fleet near ${destination.title}`,
      url: fleetUrl,
    },
  }
}
