import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JsonLdScript } from '@/components/seo/json-ld-script'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { destinations } from '@/data/destinations'
import { buildPageMetadata } from '@/lib/seo/build-page-metadata'
import { buildDestinationJsonLd } from '@/lib/seo/destination-json-ld'
import { getMetadataSiteUrl } from '@/lib/seo/site-metadata'

export const revalidate = 86400

export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const d = destinations.find((x) => x.id === slug)
  if (!d) return { title: 'Destination' }
  const description = `${d.description} Explore verified self-drive vehicles near ${d.fleetLocationQuery}, Mumbai.`
  return buildPageMetadata({
    title: `${d.title} — luxury self-drive Mumbai`,
    description,
    path: `/destinations/${d.id}`,
    keywords: [d.title, 'Mumbai self drive', 'luxury car rental', d.fleetLocationQuery, 'Oxour Go'],
    ogImage: d.imageUrl,
  })
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const d = destinations.find((x) => x.id === slug)
  if (!d) notFound()

  const base = getMetadataSiteUrl()
  const fleetHref = `/fleet?location=${encodeURIComponent(d.fleetLocationQuery)}`

  return (
    <>
      <JsonLdScript id={`dest-jsonld-${d.id}`} data={buildDestinationJsonLd(d, base)} />
      <Section className="pt-8 md:pt-10">
        <article className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
          <div className="min-w-0">
            <header>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-electric/85">Mumbai drives</p>
              <h1 className="text-section-title mt-3 text-left text-soft">{d.title}</h1>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted">{d.description}</p>
            </header>

            <div className="relative mt-8 aspect-[16/10] overflow-hidden rounded-3xl border border-stroke bg-carbon-deep shadow-[var(--shadow-card)]">
              <Image
                src={d.imageUrl}
                alt={d.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-matte/80 via-transparent to-transparent" />
            </div>

            <nav className="mt-8 text-sm text-muted" aria-label="Breadcrumb">
              <ol className="flex flex-wrap gap-2">
                <li>
                  <Link href="/" className="text-electric hover:underline">
                    Home
                  </Link>
                </li>
                <li aria-hidden className="text-silver/50">
                  /
                </li>
                <li>
                  <Link href="/fleet" className="text-electric hover:underline">
                    Fleet
                  </Link>
                </li>
                <li aria-hidden className="text-silver/50">
                  /
                </li>
                <li className="text-soft">{d.title}</li>
              </ol>
            </nav>
          </div>

          <aside className="glass-panel min-w-0 space-y-5 rounded-3xl border border-stroke p-6 shadow-[var(--shadow-card)] lg:sticky lg:top-28">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-soft">Plan from this corridor</h2>
            <p className="text-sm leading-relaxed text-muted">
              Open the fleet with search context tuned to {d.fleetLocationQuery}. Adjust dates and hubs anytime before you
              confirm.
            </p>
            <Button size="lg" to={fleetHref} className="w-full">
              Browse matching vehicles
            </Button>
            <Button size="lg" variant="secondary" to="/support" className="w-full">
              Concierge support
            </Button>
          </aside>
        </article>
      </Section>
    </>
  )
}
