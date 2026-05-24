'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react'

import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { FleetAddVehicleModal } from '@/components/admin/fleet/fleet-add-vehicle-modal'
import { FleetEditVehicleModal } from '@/components/admin/fleet/fleet-edit-vehicle-modal'
import { FleetUtilizationHero } from '@/components/admin/fleet/fleet-utilization-hero'
import { FleetVehicleCard } from '@/components/admin/fleet/fleet-vehicle-card'
import { FleetVehicleListRow } from '@/components/admin/fleet/fleet-vehicle-list-row'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { AdminFleetDashboardMetrics, AdminFleetPageResult, AdminVehicleRow } from '@/lib/admin/data/fleet'
import { stringifyFleetQuery } from '@/lib/admin/fleet-list-url'
import { cn } from '@/lib/utils/cn'

const PAGE_SIZE_OPTS = [12, 24, 36, 48] as const

const AVAIL_TABS = [
  { id: 'all', label: 'All' },
  { id: 'bookable', label: 'Bookable' },
  { id: 'offline', label: 'Offline' },
] as const

const FEAT_TABS = [
  { id: 'all', label: 'All' },
  { id: 'yes', label: 'Featured' },
  { id: 'no', label: 'Standard' },
] as const

export type AdminFleetManagerProps = {
  pageResult: AdminFleetPageResult
  listQuery: {
    q: string
    avail: string
    feat: string
    view: 'grid' | 'list'
    page: number
    pageSize: number
  }
  metrics: AdminFleetDashboardMetrics
  initialOpenAdd: boolean
  loadError: string | null
}

function buildFleetListHref(
  current: AdminFleetManagerProps['listQuery'],
  patch: Partial<{
    q: string
    avail: string
    feat: string
    view: 'grid' | 'list'
    page: number
    per: number
  }>,
) {
  const q = patch.q !== undefined ? patch.q : current.q
  const avail = patch.avail !== undefined ? patch.avail : current.avail
  const feat = patch.feat !== undefined ? patch.feat : current.feat
  const view = patch.view !== undefined ? patch.view : current.view
  const page = patch.page !== undefined ? patch.page : current.page
  const per = patch.per !== undefined ? patch.per : current.pageSize

  return `/admin/fleet${stringifyFleetQuery({
    q: q.trim() || undefined,
    avail: avail && avail !== 'all' ? avail : undefined,
    feat: feat && feat !== 'all' ? feat : undefined,
    view: view !== 'grid' ? view : undefined,
    page: page > 1 ? page : undefined,
    per: per !== 12 ? per : undefined,
  })}`
}

export function AdminFleetManager({
  pageResult,
  listQuery,
  metrics,
  initialOpenAdd,
  loadError,
}: AdminFleetManagerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [addOpen, setAddOpen] = useState(Boolean(initialOpenAdd))
  const [editVehicle, setEditVehicle] = useState<AdminVehicleRow | null>(null)
  const [draftQ, setDraftQ] = useState(listQuery.q)

  useEffect(() => {
    setDraftQ(listQuery.q)
  }, [listQuery.q])

  useEffect(() => {
    if (initialOpenAdd) setAddOpen(true)
  }, [initialOpenAdd])

  const { rows, totalCount, page, pageSize } = pageResult
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const availHref = (avail: string) => buildFleetListHref(listQuery, { avail, page: 1 })
  const featHref = (feat: string) => buildFleetListHref(listQuery, { feat, page: 1 })
  const viewHref = (view: 'grid' | 'list') => buildFleetListHref(listQuery, { view, page: 1 })
  const pageHref = (p: number) => buildFleetListHref(listQuery, { page: p })

  const hasActiveFilters =
    listQuery.q.trim().length > 0 || listQuery.avail !== 'all' || listQuery.feat !== 'all'

  const closeAdd = () => {
    setAddOpen(false)
    if (initialOpenAdd) {
      startTransition(() => {
        router.replace(`${pathname}${stringifyFleetQuery({
          q: listQuery.q.trim() || undefined,
          avail: listQuery.avail !== 'all' ? listQuery.avail : undefined,
          feat: listQuery.feat !== 'all' ? listQuery.feat : undefined,
          view: listQuery.view !== 'grid' ? listQuery.view : undefined,
          page: listQuery.page > 1 ? listQuery.page : undefined,
          per: listQuery.pageSize !== 12 ? listQuery.pageSize : undefined,
        })}`)
      })
    }
  }

  const showEmpty = !loadError && totalCount === 0
  const showRows = !loadError && rows.length > 0

  return (
    <div className="space-y-8">
      <FleetUtilizationHero metrics={metrics} />

      {metrics.featuredVehicles === 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm text-soft flex items-start gap-3 shadow-[var(--shadow-card)]">
          <Sparkles className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold text-amber-200">No Featured Vehicles for Marketing</p>
            <p className="text-muted text-xs leading-relaxed">
              You currently have 0 vehicles marked as featured. This means no vehicles will be spotlighted on the public landing page. Please edit at least one vehicle in your catalog and check the <strong>&quot;Featured&quot;</strong> option to showcase it on marketing surfaces.
            </p>
          </div>
        </div>
      )}

      <AdminCard className="overflow-hidden">
        <AdminCardContent className="space-y-4 border-b border-white/[0.06] pb-5 sm:space-y-5 sm:pb-6">
          <form
            className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
            onSubmit={(e) => {
              e.preventDefault()
              const next = draftQ.trim()
              startTransition(() => {
                router.push(
                  `${pathname}${stringifyFleetQuery({
                    q: next || undefined,
                    avail: listQuery.avail !== 'all' ? listQuery.avail : undefined,
                    feat: listQuery.feat !== 'all' ? listQuery.feat : undefined,
                    view: listQuery.view !== 'grid' ? listQuery.view : undefined,
                    page: 1,
                    per: listQuery.pageSize !== 12 ? listQuery.pageSize : undefined,
                  })}`,
                )
              })
            }}
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Input
                label="Search fleet"
                placeholder="Brand, model, registration, city, ID…"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                className="border-white/[0.08] bg-white/[0.04] shadow-none theme-light:bg-white/80"
              />
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Button type="submit" className="w-full gap-2 sm:w-auto" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
                Apply
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={isPending}
                onClick={() => {
                  setDraftQ('')
                  startTransition(() => {
                    router.push(
                      `${pathname}${stringifyFleetQuery({
                        avail: listQuery.avail !== 'all' ? listQuery.avail : undefined,
                        feat: listQuery.feat !== 'all' ? listQuery.feat : undefined,
                        view: listQuery.view !== 'grid' ? listQuery.view : undefined,
                        page: 1,
                        per: listQuery.pageSize !== 12 ? listQuery.pageSize : undefined,
                      })}`,
                    )
                  })
                }}
              >
                Clear search
              </Button>
              <Button type="button" className="w-full gap-2 sm:w-auto" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Add vehicle
              </Button>
            </div>
          </form>

          <div className="flex flex-col gap-4 xl:flex-row xl:flex-wrap xl:items-start xl:justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Availability</span>
              <div className="flex flex-wrap gap-2">
                {AVAIL_TABS.map((t) => {
                  const active = listQuery.avail === t.id
                  return (
                    <Link
                      key={t.id}
                      href={availHref(t.id)}
                      className={cn(
                        'inline-flex min-h-9 items-center rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300',
                        active
                          ? 'border-electric/45 bg-electric/18 text-electric'
                          : 'border-white/[0.08] bg-white/[0.03] text-muted hover:border-white/[0.12] hover:text-soft theme-light:border-stroke-strong theme-light:bg-white/70',
                      )}
                    >
                      {t.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Listing</span>
              <div className="flex flex-wrap gap-2">
                {FEAT_TABS.map((t) => {
                  const active = listQuery.feat === t.id
                  return (
                    <Link
                      key={t.id}
                      href={featHref(t.id)}
                      className={cn(
                        'inline-flex min-h-9 items-center rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300',
                        active
                          ? 'border-electric/45 bg-electric/18 text-electric'
                          : 'border-white/[0.08] bg-white/[0.03] text-muted hover:border-white/[0.12] hover:text-soft theme-light:border-stroke-strong theme-light:bg-white/70',
                      )}
                    >
                      {t.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex rounded-xl border border-white/[0.08] p-0.5 theme-light:border-stroke-strong">
                <Link
                  href={viewHref('grid')}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-xs font-semibold transition-colors',
                    listQuery.view === 'grid'
                      ? 'bg-electric/18 text-electric'
                      : 'text-muted hover:text-soft',
                  )}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                  Grid
                </Link>
                <Link
                  href={viewHref('list')}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-xs font-semibold transition-colors',
                    listQuery.view === 'list'
                      ? 'bg-electric/18 text-electric'
                      : 'text-muted hover:text-soft',
                  )}
                >
                  <List className="h-4 w-4" aria-hidden />
                  List
                </Link>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <label htmlFor="fleet-per-page" className="text-xs font-medium text-muted">
                  Per page
                </label>
                <select
                  id="fleet-per-page"
                  value={String(pageSize)}
                  disabled={isPending}
                  onChange={(e) => {
                    const per = Number(e.target.value)
                    startTransition(() => {
                      router.push(
                        `${pathname}${stringifyFleetQuery({
                          q: listQuery.q.trim() || undefined,
                          avail: listQuery.avail !== 'all' ? listQuery.avail : undefined,
                          feat: listQuery.feat !== 'all' ? listQuery.feat : undefined,
                          view: listQuery.view !== 'grid' ? listQuery.view : undefined,
                          page: 1,
                          per: per !== 12 ? per : undefined,
                        })}`,
                      )
                    })
                  }}
                  className={cn(
                    'h-11 min-h-11 w-full rounded-xl border border-stroke-strong bg-matte/[0.55] px-3 text-base font-medium text-soft theme-light:bg-white/80 sm:h-10 sm:min-h-10 sm:w-auto sm:min-w-[4.5rem] sm:text-sm',
                    'focus:border-electric/55 focus:outline-none focus:ring-2 focus:ring-electric/22',
                  )}
                >
                  {PAGE_SIZE_OPTS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loadError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100 theme-light:border-red-600/25 theme-light:bg-red-500/8 theme-light:text-red-900"
            >
              {loadError}
            </div>
          ) : null}

          <p className="text-xs text-muted">
            Showing{' '}
            <span className="font-semibold text-soft">
              {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)}
            </span>{' '}
            of <span className="font-semibold text-soft">{totalCount}</span> vehicles · Supabase-backed pagination
          </p>
        </AdminCardContent>

        <div className="relative min-h-[200px]">
          {isPending ? (
            <div
              className="absolute inset-0 z-30 flex items-center justify-center rounded-b-2xl bg-matte/55 backdrop-blur-sm theme-light:bg-white/60"
              aria-busy="true"
              aria-label="Refreshing"
            >
              <Loader2 className="h-8 w-8 animate-spin text-electric" />
            </div>
          ) : null}

          {showEmpty ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center sm:py-24">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.09] to-white/[0.02] shadow-[var(--shadow-card)] backdrop-blur-xl ring-1 ring-inset ring-white/[0.04]">
                <Inbox className="h-7 w-7 text-muted" aria-hidden />
              </div>
              <div className="max-w-md space-y-2">
                <p className="text-lg font-semibold tracking-[-0.02em] text-soft">
                  {hasActiveFilters ? 'No vehicles match this view' : 'Your fleet is empty'}
                </p>
                <p className="text-sm leading-relaxed text-muted">
                  {hasActiveFilters
                    ? 'Adjust search, availability, or listing filters. Results load from Supabase with server-side pagination.'
                    : 'Create the first catalog vehicle to power the storefront, availability engine, and admin bookings.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {hasActiveFilters ? (
                  <Button type="button" variant="secondary" to="/admin/fleet">
                    Reset filters
                  </Button>
                ) : null}
                <Button type="button" onClick={() => setAddOpen(true)}>
                  {hasActiveFilters ? 'Add vehicle' : 'Add first vehicle'}
                </Button>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted backdrop-blur-md theme-light:border-stroke-strong theme-light:bg-white/70">
                <Sparkles className="h-3.5 w-3.5 text-electric" aria-hidden />
                Live Supabase sync
              </div>
            </div>
          ) : showRows ? (
            <>
              {listQuery.view === 'grid' ? (
                <div className="grid gap-5 p-4 sm:p-6 sm:grid-cols-2 xl:grid-cols-3">
                  {rows.map((v) => (
                    <FleetVehicleCard key={v.id} vehicle={v} onEdit={() => setEditVehicle(v)} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3 p-4 sm:p-6">
                  {rows.map((v) => (
                    <FleetVehicleListRow key={v.id} vehicle={v} onEdit={() => setEditVehicle(v)} />
                  ))}
                </div>
              )}

              <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] px-4 py-5 sm:flex-row sm:px-6 theme-light:border-stroke">
                <p className="text-xs text-muted">
                  Page <span className="font-semibold text-soft">{page}</span> of{' '}
                  <span className="font-semibold text-soft">{totalPages}</span>
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {page > 1 ? (
                    <Button type="button" variant="secondary" size="sm" className="gap-1" disabled={isPending} to={pageHref(page - 1)}>
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                      Prev
                    </Button>
                  ) : (
                    <span className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-white/[0.06] px-3 py-2 text-sm font-semibold text-muted opacity-40 theme-light:border-stroke">
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                      Prev
                    </span>
                  )}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = i + 1
                    if (totalPages > 5) {
                      const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                      p = start + i
                    }
                    if (p > totalPages) return null
                    const active = p === page
                    return (
                      <Link
                        key={p}
                        href={pageHref(p)}
                        className={cn(
                          'flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition-colors',
                          active
                            ? 'border-electric/45 bg-electric/18 text-electric'
                            : 'border-white/[0.08] bg-white/[0.03] text-muted hover:border-white/[0.12] hover:text-soft theme-light:border-stroke-strong theme-light:bg-white/70',
                        )}
                      >
                        {p}
                      </Link>
                    )
                  })}
                  {page < totalPages ? (
                    <Button type="button" variant="secondary" size="sm" className="gap-1" disabled={isPending} to={pageHref(page + 1)}>
                      Next
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Button>
                  ) : (
                    <span className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-white/[0.06] px-3 py-2 text-sm font-semibold text-muted opacity-40 theme-light:border-stroke">
                      Next
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </AdminCard>

      <FleetAddVehicleModal open={addOpen} onClose={closeAdd} />
      <FleetEditVehicleModal vehicle={editVehicle} onClose={() => setEditVehicle(null)} />
    </div>
  )
}
