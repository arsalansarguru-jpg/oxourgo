import { JsonLdScript } from '@/components/seo/json-ld-script'
import { FleetClientView } from '@/features/fleet/fleet-client-view'
import { buildFleetItemListJsonLd } from '@/lib/seo/fleet-item-list-json-ld'
import type { FleetCar } from '@/lib/fleet/types'
import { getMetadataSiteUrl } from '@/lib/seo/site-metadata'

type FleetViewProps = {
  cars: FleetCar[]
  from?: string
  to?: string
  location?: string
  /** Keyword prefill for fleet text search (homepage / deep links). */
  searchQuery?: string
}

export function FleetView({ cars, from, to, location, searchQuery }: FleetViewProps) {
  const jsonLd = buildFleetItemListJsonLd(cars, getMetadataSiteUrl())

  return (
    <>
      <JsonLdScript id="fleet-catalog-jsonld" data={jsonLd} />
      <FleetClientView
        cars={cars}
        from={from}
        to={to}
        location={location}
        searchQuery={searchQuery}
      />
    </>
  )
}
