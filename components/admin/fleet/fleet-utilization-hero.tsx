'use client'

import { Car, Star, TrendingUp, Wallet } from 'lucide-react'

import type { AdminFleetDashboardMetrics } from '@/lib/admin/data/fleet'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint?: string
  icon: typeof Car
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl ring-1 ring-inset ring-white/[0.04] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] sm:p-5',
        'theme-light:border-stroke-strong theme-light:from-white theme-light:to-white/85 theme-light:ring-black/[0.03]',
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-electric theme-light:border-stroke theme-light:bg-white">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-[-0.03em] text-soft sm:text-3xl">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-muted">{hint}</p> : null}
    </div>
  )
}

type Props = {
  metrics: AdminFleetDashboardMetrics
}

export function FleetUtilizationHero({ metrics }: Props) {
  const { bookableUtilizationPercent, vehiclesOnTripToday, totalVehicles, availableVehicles, featuredVehicles, avgPricePerDay } =
    metrics
  const ringPct = Math.min(100, Math.max(0, bookableUtilizationPercent))

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)] lg:items-stretch">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Fleet size" value={String(totalVehicles)} hint="Vehicles in public catalog" icon={Car} />
        <StatTile
          label="Bookable"
          value={String(availableVehicles)}
          hint="Available for new reservations"
          icon={TrendingUp}
        />
        <StatTile label="Featured" value={String(featuredVehicles)} hint="Highlighted on marketing surfaces" icon={Star} />
        <StatTile
          label="Avg. daily rate"
          value={avgPricePerDay != null ? formatInr(avgPricePerDay) : '—'}
          hint="Mean of list prices"
          icon={Wallet}
        />
      </div>

      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-[var(--shadow-card)] backdrop-blur-xl ring-1 ring-inset ring-white/[0.04] theme-light:border-stroke-strong theme-light:from-white theme-light:to-white/80',
        )}
      >
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Fleet pulse</p>
        <div className="relative h-36 w-36">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from -90deg, rgba(59,130,246,0.95) ${ringPct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
            }}
          />
          <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full border border-white/[0.06] bg-matte/90 backdrop-blur-md theme-light:border-stroke theme-light:bg-white/95">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-soft">{ringPct}%</span>
            <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wide text-muted">
              bookable
              <br />
              utilization
            </span>
          </div>
        </div>
        <p className="max-w-[240px] text-center text-xs leading-relaxed text-muted">
          {vehiclesOnTripToday} vehicle{vehiclesOnTripToday === 1 ? '' : 's'} on confirmed or active trips today.
          Pending-payment holds are not counted as deployed.
        </p>
      </div>
    </div>
  )
}
