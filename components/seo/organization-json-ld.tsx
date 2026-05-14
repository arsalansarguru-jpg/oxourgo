import Script from 'next/script'

import { BRAND } from '@/constants/brand'
import { getMetadataSiteUrl } from '@/lib/seo/site-metadata'
import { serializeJsonLd } from '@/lib/seo/serialize-json-ld'

/**
 * Global Organization + AutoRental (LocalBusiness) graph for brand and Mumbai service area.
 */
export function OrganizationAndLocalBusinessJsonLd() {
  const base = getMetadataSiteUrl()
  const logo = `${base}/favicon.svg`

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${base}/#organization`,
        name: BRAND.name,
        url: base,
        logo: { '@type': 'ImageObject', url: logo },
        email: BRAND.email,
        telephone: BRAND.phoneTel,
        sameAs: [BRAND.whatsapp],
      },
      {
        '@type': 'AutoRental',
        '@id': `${base}/#business`,
        name: BRAND.name,
        image: logo,
        url: base,
        telephone: BRAND.phoneTel,
        email: BRAND.email,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Mumbai',
          addressRegion: 'Maharashtra',
          addressCountry: 'IN',
        },
        areaServed: {
          '@type': 'City',
          name: 'Mumbai',
        },
        priceRange: '₹₹₹',
        parentOrganization: { '@id': `${base}/#organization` },
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: base,
        name: BRAND.name,
        publisher: { '@id': `${base}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${base}/fleet?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <Script
      id="oxour-global-jsonld"
      type="application/ld+json"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
    />
  )
}
