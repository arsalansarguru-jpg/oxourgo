import { JsonLdScript } from '@/components/seo/json-ld-script'
import { FleetClientView } from '@/features/fleet/fleet-client-view'
import { buildFleetItemListJsonLd } from '@/lib/seo/fleet-item-list-json-ld'
import { getFleetCars } from '@/lib/fleet/get-fleet-cars'
import { getMetadataSiteUrl } from '@/lib/seo/site-metadata'

type FleetViewProps = {
  pickup?: string
  from?: string
  to?: string
  location?: string
  /** Keyword prefill for fleet text search (homepage / deep links). */
  searchQuery?: string
}

export async function FleetView({ pickup, from, to, location, searchQuery }: FleetViewProps) {
  const result = await getFleetCars()
  const jsonLd = buildFleetItemListJsonLd(result.cars, getMetadataSiteUrl())

  return (
    <>
      <JsonLdScript id="fleet-catalog-jsonld" data={jsonLd} />
      <FleetClientView
        cars={result.cars}
        pickup={pickup}
        from={from}
        to={to}
        location={location}
        searchQuery={searchQuery}
      />
    </>
  )
}
