'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'

import { captureClientEvent } from '@/lib/analytics/capture-client'
import { BOOKING_FUNNEL, POSTHOG_EVENTS } from '@/lib/analytics/posthog-events'
import { EmptyFleet } from '@/components/fleet/empty-fleet'
import { FleetCarCard } from '@/components/fleet/fleet-car-card'
import { FleetFilterDrawer } from '@/components/fleet/fleet-filter-drawer'
import { FleetGridSkeleton } from '@/components/fleet/fleet-grid-skeleton'
import { FilterPills } from '@/components/fleet/filter-pills'
import { Input } from '@/components/ui/Input'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { FleetCar, FleetFilterId } from '@/lib/fleet/types'
import { carMatchesFilters } from '@/lib/fleet/filter-utils'

const PAGE_SIZE = 12

type FleetClientViewProps = {
  cars: FleetCar[]
  from?: string
  to?: string
  /** Pre-fills text search (e.g. from homepage search or destination cards). */
  location?: string
  /** Keyword search from `?q=` (takes precedence over `location` when both are set). */
  searchQuery?: string
}

export function FleetClientView({
  cars,
  from = '',
  to = '',
  location = '',
  searchQuery = '',
}: FleetClientViewProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState('')
  const debouncedQuery = useDebouncedValue(searchInput, 280)
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => new Set())
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const fromQ = searchQuery.trim()
    const fromLoc = location.trim()
    const text = fromQ || fromLoc
    if (text) setSearchInput(text)
  }, [location, searchQuery])

  const toggle = (id: FleetFilterId) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    return cars.filter((car) => {
      const haystack = `${car.displayName} ${car.brand} ${car.model} ${car.city ?? ''}`.toLowerCase()
      if (q && !haystack.includes(q)) return false
      return carMatchesFilters(car, activeFilters)
    })
  }, [cars, debouncedQuery, activeFilters])

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
  const hasSearch = debouncedQuery.trim().length > 0
  const refinementCount = activeFilterCount + (hasSearch ? 1 : 0)
  const isSearchDebouncing = searchInput.trim() !== debouncedQuery.trim()

  useEffect(() => {
    if (isSearchDebouncing) return
    const handle = window.setTimeout(() => {
      const len = debouncedQuery.trim().length
      const textBucket = len === 0 ? 'none' : len <= 8 ? 'short' : len <= 20 ? 'medium' : 'long'
      captureClientEvent(POSTHOG_EVENTS.fleetSearch, {
        funnel: BOOKING_FUNNEL,
        step: 'fleet_search',
        text_bucket: textBucket,
        has_text: len > 0,
        filter_count: activeFilters.size,
        page: currentPage,
        has_date_context: Boolean(from || to),
      })
    }, 360)
    return () => window.clearTimeout(handle)
  }, [activeFilters, currentPage, debouncedQuery, from, isSearchDebouncing, to])

  const clearAllFilters = () => {
    setActiveFilters(new Set())
    setSearchInput('')
    setPage(1)
    setFiltersOpen(false)
  }

  const gridLayoutKey = `${debouncedQuery}|${[...activeFilters].sort().join(',')}|${currentPage}`

  return (
    <Section className="pt-8 md:pt-12" data-testid="fleet-page">
      <SectionHeading
        eyebrow="Fleet"
        title="Curated fleet"
        subtitle="Search, filter, and reserve verified luxury and premium vehicles — all pickups at our Mira Road hub."
      />

      {(from || to || location.trim() || searchQuery.trim()) && (
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-3xl border border-electric/25 bg-carbon/80 px-4 py-3.5 text-center text-sm leading-relaxed text-muted shadow-[var(--shadow-card)]">
          {from ? (
            <span>
              From: <span className="font-semibold text-soft">{from}</span>
            </span>
          ) : null}
          {to ? (
            <span>
              To: <span className="font-semibold text-soft">{to}</span>
            </span>
          ) : null}
          {searchQuery.trim() ? (
            <span className="basis-full sm:basis-auto">
              Keywords: <span className="font-semibold text-soft">{searchQuery.trim()}</span>
            </span>
          ) : location.trim() ? (
            <span className="basis-full sm:basis-auto">
              Search: <span className="font-semibold text-soft">{location.trim()}</span>
            </span>
          ) : null}
        </div>
      )}

      <div className="sticky top-[var(--public-header-offset)] z-40 -mx-[var(--spacing-edge)] mt-6 min-w-0 rounded-3xl border border-stroke bg-carbon/90 px-[var(--spacing-edge)] py-3 shadow-[0_24px_80px_-50px_rgba(0,0,0,0.75)] backdrop-blur-2xl supports-[backdrop-filter]:bg-carbon/82 md:mx-0 md:py-4 lg:sticky lg:top-[var(--public-header-offset)]">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="relative w-full lg:max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-silver" />
                    <Input
                      aria-label="Search fleet"
                      placeholder="Search by brand, model, or hub…"
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value)
                        setPage(1)
                      }}
                      className="pl-10"
                    />
                  </div>
                  {isSearchDebouncing ? (
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-electric/90">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-electric" aria-hidden />
                      Refining results…
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
                  {refinementCount > 0 ? (
                    <span className="inline-flex min-h-9 items-center rounded-full border border-electric/35 bg-electric/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-electric">
                      {refinementCount} active
                    </span>
                  ) : null}
                  {refinementCount > 0 ? (
                    <Button type="button" variant="secondary" size="sm" className="min-h-10" onClick={clearAllFilters}>
                      Clear all
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 lg:hidden"
                    onClick={() => setFiltersOpen(true)}
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden />
                    Filters
                    {refinementCount > 0 ? (
                      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-electric px-1.5 py-0.5 text-[11px] font-bold text-white">
                        {refinementCount}
                      </span>
                    ) : null}
                  </Button>
                </div>
              </div>

              <div className="hidden border-t border-stroke/80 pt-4 md:block">
                <FilterPills active={activeFilters} onToggle={toggle} layout="stacked" cars={cars} />
              </div>
            </div>
          </div>

          <FleetFilterDrawer
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            footer={
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={clearAllFilters}>
                  Clear all
                </Button>
                <Button type="button" className="w-full sm:w-auto" onClick={() => setFiltersOpen(false)}>
                  View results
                </Button>
              </div>
            }
          >
            <FilterPills active={activeFilters} onToggle={toggle} layout="stacked" cars={cars} />
          </FleetFilterDrawer>

          {cars.length > 0 ? (
            <motion.p
              className="text-sm text-muted"
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <span className="font-semibold text-soft">{total}</span> vehicle{total === 1 ? '' : 's'} match
              {total > 0 ? (
                <>
                  {' '}
                  · Showing{' '}
                  <span className="font-semibold text-soft">
                    {total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)}
                  </span>
                </>
              ) : null}
              {total > PAGE_SIZE ? (
                <span className="text-silver/70">
                  {' '}
                  · Page {currentPage} of {totalPages}
                </span>
              ) : null}
            </motion.p>
          ) : null}

          {cars.length === 0 ? (
            <div className="mt-8">
              <EmptyFleet kind="catalog" onClear={() => void router.refresh()} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-8">
              <EmptyFleet kind="filtered" onClear={clearAllFilters} />
            </div>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={gridLayoutKey}
                  initial={{ opacity: 0.88, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0.8, y: -4 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8"
                >
                  {isSearchDebouncing ? (
                    <FleetGridSkeleton count={PAGE_SIZE} />
                  ) : (
                    <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                      {slice.map((car) => (
                        <motion.div
                          key={car.id}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <FleetCarCard car={car} tripFrom={from} tripTo={to} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {totalPages > 1 && !isSearchDebouncing ? (
                <motion.div
                  className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="min-h-11 min-w-[5.5rem]"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Prev
                  </Button>
                  <span className="min-w-[5rem] px-2 text-center text-sm text-muted">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="min-h-11 min-w-[5.5rem]"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                </motion.div>
              ) : null}
            </>
          )}
    </Section>
  )
}
