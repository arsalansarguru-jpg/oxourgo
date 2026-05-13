'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Search } from 'lucide-react'

import { FleetCarCard } from '@/components/fleet/fleet-car-card'
import { FilterPills } from '@/components/fleet/filter-pills'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Section, SectionHeading } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import type { FleetCar, FleetFilterId } from '@/lib/fleet/types'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

type FleetClientViewProps = {
  cars: FleetCar[]
  /** Supabase / network failure loading `public.vehicles` (server passes message). */
  fetchError?: string | null
  pickup?: string
  from?: string
  to?: string
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
  fetchError = null,
  pickup = '',
  from = '',
  to = '',
}: FleetClientViewProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => new Set())

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
      const haystack = `${car.displayName} ${car.brand} ${car.model}`.toLowerCase()
      if (q && !haystack.includes(q)) return false
      return carMatchesFilters(car, activeFilters)
    })
  }, [cars, query, activeFilters])

  return (
    <Section className="pt-6 md:pt-10">
      <SectionHeading
        eyebrow="Fleet"
        title="Browse the collection"
        subtitle="Search, filter, and book verified luxury and premium economy vehicles across Mumbai hubs."
      />

      {(pickup || from || to) && !fetchError && (
        <div className="mx-auto max-w-3xl rounded-2xl border border-electric/18 bg-gradient-to-br from-electric/[0.07] to-transparent px-4 py-3.5 text-center text-sm leading-relaxed text-muted">
          {pickup ? (
            <span>
              Pickup: <span className="font-semibold text-soft">{pickup}</span>
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
        </div>
      )}

      {fetchError ? (
        <div
          className={cn(
            cardSurfaceBase,
            'rounded-2xl border border-red-400/25 bg-red-500/[0.07] p-6 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-8',
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/15 text-red-200">
              <AlertTriangle className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-lg font-semibold text-soft">Could not load fleet</h2>
              <p className="text-sm leading-relaxed text-muted">
                The app could not read <span className="font-medium text-soft">public.vehicles</span> from Supabase.
                Check environment variables on Vercel (
                <code className="rounded bg-fill-glass-strong px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>, publishable
                key), RLS policies, and project logs.
              </p>
              <p className="font-mono text-xs text-red-200/90">{fetchError}</p>
              <Button
                type="button"
                variant="secondary"
                className="mt-2 w-full sm:w-auto"
                onClick={() => router.refresh()}
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                Try again
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-stroke bg-matte/[0.72] p-3 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur-xl backdrop-saturate-150 transition-[border-color,box-shadow] duration-300 sm:p-4 lg:sticky lg:top-[3.75rem] lg:z-30 supports-[backdrop-filter]:bg-matte/55">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
                <Input
                  aria-label="Search fleet"
                  placeholder="Search by brand or model..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <FilterPills active={activeFilters} onToggle={toggle} className="lg:justify-end" />
            </div>
          </div>

          {cars.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No vehicles to show"
              description="There are no vehicles to list, or every row is hidden. Ensure public.vehicles has rows and set available = true for bookable inventory."
              actionLabel="Refresh"
              onAction={() => router.refresh()}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No vehicles match"
              description="Try clearing filters or searching for another model. Our concierge can also source special requests on WhatsApp."
              actionLabel="Clear filters"
              onAction={() => {
                setActiveFilters(new Set())
                setQuery('')
              }}
            />
          ) : (
            <motion.div layout className="grid gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {filtered.map((car) => (
                <motion.div
                  key={car.id}
                  layout
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <FleetCarCard car={car} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </Section>
  )
}
