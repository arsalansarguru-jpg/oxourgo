import type { FleetCar } from '@/lib/fleet/types'

function absUrl(siteUrl: string, src: string) {
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  const base = siteUrl.replace(/\/+$/, '')
  return `${base}${src.startsWith('/') ? '' : '/'}${src}`
}

/** Vehicle listing discovery markup (capped for payload size). */
export function buildFleetItemListJsonLd(cars: FleetCar[], siteUrl: string) {
  const base = siteUrl.replace(/\/+$/, '')
  const slice = cars.slice(0, 48)
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Oxour Go verified fleet',
    description: 'Luxury and premium self-drive vehicles in Mumbai.',
    numberOfItems: cars.length,
    itemListElement: slice.map((car, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: car.displayName,
        category: car.category,
        brand: { '@type': 'Brand', name: car.brand },
        model: car.model,
        sku: car.id,
        image: absUrl(siteUrl, car.imageUrl),
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: car.pricePerDay,
          url: `${base}/car/${car.id}`,
          availability:
            car.availability === 'Available'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
        },
      },
    })),
  }
}
