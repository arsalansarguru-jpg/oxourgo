import type { Car } from '@/types/car'

function absImage(siteUrl: string, src: string) {
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  const base = siteUrl.replace(/\/+$/, '')
  return `${base}${src.startsWith('/') ? '' : '/'}${src}`
}

/** Product markup for vehicle detail URLs. */
export function buildCarProductJsonLd(car: Car, siteUrl: string) {
  const base = siteUrl.replace(/\/+$/, '')
  const images = [car.imageUrl, ...car.gallery].map((u) => absImage(siteUrl, u))
  const availability =
    car.status === 'Available' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: car.name,
    description: car.description,
    image: images,
    category: car.category,
    brand: { '@type': 'Brand', name: 'Oxour Go' },
    sku: car.id,
    offers: {
      '@type': 'Offer',
      url: `${base}/car/${car.id}`,
      priceCurrency: 'INR',
      price: car.pricePerDay,
      availability,
      seller: {
        '@type': 'AutoRental',
        name: 'Oxour Go',
        url: base,
      },
    },
    ...(car.reviews > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: car.rating,
            reviewCount: car.reviews,
          },
        }
      : {}),
  }
}
