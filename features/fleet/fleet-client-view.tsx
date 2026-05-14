'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react'

import { EmptyFleet } from '@/components/fleet/empty-fleet'
import { FleetCarCard } from '@/components/fleet/fleet-car-card'
import { FilterPills } from '@/components/fleet/filter-pills'
import { DataLoadErrorPanel } from '@/components/ui/data-load-error'
import { Input } from '@/components/ui/Input'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import type { FleetCar, FleetFilterId } from '@/lib/fleet/types'

const PAGE_SIZE = 12

type FleetClientViewProps = {
  cars: FleetCar[]
  /** True when the server could not load fleet data (details are server-logged only). */
  loadFailed?: boolean
  pickup?: string
  from?: string
  to?: string
  /** Pre-fills text search (e.g. from homepage search or destination cards). */
  location?: string
}

function carMatchesFilters(car: FleetCar, active: Set<string>) {
  if (active.size === 0) return true

  const categoryKeys = ['SUV', 'Sedan', 'Hatchback', 'Luxury', 'Budget'] as const
  const activeCats = categoryKeys.filter((k) => active.has(k))
  const activeTrans = (['Automatic', 'Manual'] as const).filter((k) => active.has(k))

  const catOk =
    activeCats.length === 0 ||
    activeCats.some((key) => {
      if (key === 'Budget') return car.pricePerDay <= 3500
      return car.category === key
    })

  const transOk =
    activeTrans.length === 0 ||
    activeTrans.some((key) =>
      key === 'Automatic' ? car.transmission === 'Auto' : car.transmission === 'Manual',
    )

  return catOk && transOk
}

export function FleetClientView({
  cars,
  loadFailed = false,
  pickup = '',
  from = '',
  to = '',
  location = '',
}: FleetClientViewProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => new Set())
  const [page, setPage] = useState(1)

  useEffect(() => {
    const loc = location.trim()
    if (loc) setQuery(loc)
  }, [location])

  const toggle = (id: FleetFilterId) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cars.filter((car) => {
      const haystack = `${car.displayName} ${car.brand} ${car.model} ${car.city ?? ''}`.toLowerCase()
      if (q && !haystack.includes(q)) return false
      return carMatchesFilters(car, activeFilters)
    })
  }, [cars, query, activeFilters])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const slice = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  const activeFilterCount = activeFilters.size
  const clearAllFilters = () => {
    setActiveFilters(new Set())
    setQuery('')
    setPage(1)
  }

  return (
    <Section className="pt-6 md:pt-10">
      <SectionHeading
        eyebrow="Fleet"
        title="Browse the collection"
        subtitle="Search, filter, and book verified luxury and premium economy vehicles across Mumbai hubs."
      />

      {(pickup || from || to || location.trim()) && !loadFailed && (
        <div className="mx-auto max-w-3xl rounded-2xl border border-electric/18 bg-gradient-to-br from-electric/[0.07] to-transparent px-4 py-3.5 text-center text-sm leading-relaxed text-muted">
          {pickup ? (
            <span>
              Hub: <span className="font-semibold text-soft">{pickup}</span>
            </span>
          ) : null}
          {from ? (
            <span className="ml-2">
              From: <span className="font-semibold text-soft">{from}</span>
            </span>
          ) : null}
          {to ? (
            <span className="ml-2">
              To: <span className="font-semibold text-soft">{to}</span>
            </span>
          ) : null}
          {location.trim() ? (
            <span className="ml-2 block sm:inline">
              Search: <span className="font-semibold text-soft">{location.trim()}</span>
            </span>
          ) : null}
        </div>
      )}

      {loadFailed ? (
        <DataLoadErrorPanel
          title="Unable to load fleet"
          description="Please refresh the page or try again shortly."
          onRetry={() => router.refresh()}
          retryLabel={
            <>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Try again
            </>
          }
        />
      ) : (
        <>
          <div className="rounded-2xl border border-stroke bg-matte/[0.72] p-3 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur-xl backdrop-saturate-150 transition-[border-color,box-shadow] duration-300 sm:p-4 lg:sticky lg:top-[3.75rem] lg:z-30 supports-[backdrop-filter]:bg-matte/55">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
                <Input
                  aria-label="Search fleet"
                  placeholder="Search by brand, model, or hub…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col gap-3 lg:items-end">
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {activeFilterCount > 0 ? (
                    <span className="inline-flex items-center rounded-full border border-electric/30 bg-electric/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-electric">
                      Filters ({activeFilterCount})
                    </span>
                  ) : null}
                  {activeFilterCount > 0 || query.trim() ? (
                    <Button type="button" variant="secondary" size="sm" onClick={clearAllFilters}>
                      Clear all
                    </Button>
                  ) : null}
                </div>
                <FilterPills active={activeFilters} onToggle={toggle} className="lg:justify-end" />
              </div>
            </div>
          </div>

          {!loadFailed && cars.length > 0 ? (
            <p className="mt-4 text-sm text-muted">
              Showing{' '}
              <span className="font-semibold text-soft">
                {total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)}
              </span>{' '}
              of <span className="font-semibold text-soft">{total}</span> vehicles
              {total > PAGE_SIZE ? (
                <span className="text-silver/70">
                  {' '}
                  · Page {currentPage} of {totalPages}
                </span>
              ) : null}
            </p>
          ) : null}

          {cars.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-stroke bg-matte/[0.5] px-6 py-16 text-center">
              <Search className="mx-auto h-10 w-10 text-muted" aria-hidden />
              <p className="mt-4 text-lg font-semibold text-soft">No vehicles to show</p>
              <p className="mt-2 text-sm text-muted">
                Nothing is listed yet. Try refreshing or contact concierge on WhatsApp.
              </p>
              <Button type="button" className="mt-6" onClick={() => router.refresh()}>
                Refresh
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-8">
              <EmptyFleet onClear={clearAllFilters} />
            </div>
          ) : (
            <>
              <motion.div layout className="mt-8 grid gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                {slice.map((car) => (
                  <motion.div
                    key={car.id}
                    layout
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <FleetCarCard car={car} />
                  </motion.div>
                ))}
              </motion.div>

              {totalPages > 1 ? (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Prev
                  </Button>
                  <span className="px-2 text-sm text-muted">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </>
      )}
    </Section>
  )
}
