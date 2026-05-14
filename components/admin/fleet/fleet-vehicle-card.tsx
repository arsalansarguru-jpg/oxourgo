'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useOptimistic, useState, useTransition } from 'react'
import { Gauge, Pencil, Sparkles } from 'lucide-react'

import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import {
  adminSetVehicleAvailableAction,
  adminToggleVehicleFeaturedAction,
} from '@/lib/admin/actions/vehicle-actions'
import type { AdminVehicleRow } from '@/lib/admin/data/fleet'
import { fleetVehicleImageUrl } from '@/lib/admin/fleet-image-url'
import { formatInr } from '@/lib/format'
import { cn } from '@/lib/utils/cn'

type Props = {
  vehicle: AdminVehicleRow
  onEdit: () => void
}

export function FleetVehicleCard({ vehicle, onEdit }: Props) {
  const router = useRouter()
  const thumb = fleetVehicleImageUrl(vehicle.image)
  const initialAvailable = vehicle.available !== false
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [optimisticFeatured, setFeatured] = useOptimistic(vehicle.featured, (_p, n: boolean) => n)
  const [optimisticAvailable, setAvailable] = useOptimistic(initialAvailable, (_p, n: boolean) => n)

  const busy = pending

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[var(--shadow-card)] backdrop-blur-xl ring-1 ring-inset ring-white/[0.04] transition-[transform,box-shadow,border-color,ring-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'hover:-translate-y-1 hover:border-white/[0.12] hover:shadow-[var(--shadow-card-hover)] hover:ring-white/[0.06]',
        'theme-light:border-stroke-strong theme-light:from-white/90 theme-light:to-white/70 theme-light:ring-black/[0.04]',
      )}
    >
      <button
        type="button"
        onClick={onEdit}
        className="relative block aspect-[16/10] w-full overflow-hidden border-b border-white/[0.06] text-left theme-light:border-stroke"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-matte/80 via-transparent to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95 theme-light:from-white/90" />
        {thumb ? (
          <Image src={thumb} alt="" fill sizes="(max-width:768px) 100vw, 400px" className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full min-h-[140px] w-full items-center justify-center bg-carbon-deep text-sm text-muted">
            No image
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-[-0.02em] text-soft drop-shadow-sm">{vehicle.name}</p>
            <p className="truncate text-xs text-muted drop-shadow-sm">
              {vehicle.brand} · {vehicle.year} · {vehicle.registration_number}
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.12] bg-matte/55 text-soft opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:opacity-100 theme-light:bg-white/85">
            <Pencil className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <AdminStatusPill value={optimisticAvailable ? 'available' : 'unavailable'} />
          {optimisticFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100 theme-light:text-amber-900">
              <Sparkles className="h-3 w-3" aria-hidden />
              Featured
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 theme-light:border-stroke theme-light:bg-white/70">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Daily rate</p>
            <p className="mt-0.5 tabular-nums font-semibold text-soft">{formatInr(vehicle.price_per_day)}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 theme-light:border-stroke theme-light:bg-white/70">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Deposit</p>
            <p className="mt-0.5 tabular-nums font-semibold text-soft">{formatInr(vehicle.security_deposit)}</p>
          </div>
          <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-xs text-muted theme-light:border-stroke theme-light:bg-white/70">
            {vehicle.seats} seats · {vehicle.transmission} · {vehicle.fuel_type}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-white/[0.06] pt-4 theme-light:border-stroke">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-soft">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-stroke-strong bg-matte text-electric theme-light:bg-white"
                checked={optimisticAvailable}
                disabled={busy}
                onChange={() => {
                  const next = !optimisticAvailable
                  setMsg(null)
                  start(async () => {
                    setAvailable(next)
                    const r = await adminSetVehicleAvailableAction(vehicle.id, next)
                    if (!r.ok) {
                      setMsg(r.message)
                      setAvailable(!next)
                      return
                    }
                    router.refresh()
                  })
                }}
              />
              Bookable
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-soft">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-stroke-strong bg-matte text-electric theme-light:bg-white"
                checked={optimisticFeatured}
                disabled={busy}
                onChange={() => {
                  const next = !optimisticFeatured
                  setMsg(null)
                  start(async () => {
                    setFeatured(next)
                    const r = await adminToggleVehicleFeaturedAction(vehicle.id, next)
                    if (!r.ok) {
                      setMsg(r.message)
                      setFeatured(!next)
                      return
                    }
                    router.refresh()
                  })
                }}
              />
              Featured
            </label>
          </div>
          {msg ? <p className="text-xs text-red-300 theme-light:text-red-700">{msg}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-stroke-strong bg-fill-glass-strong px-4 py-2.5 text-sm font-semibold text-soft transition-[background-color,border-color,transform] duration-300 hover:border-electric/35 hover:bg-electric/[0.08] active:scale-[0.98] theme-light:bg-white/80"
            >
              <Gauge className="h-4 w-4 text-electric" aria-hidden />
              Manage
            </button>
            <Link
              href={`/admin/fleet/${vehicle.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-white/[0.14] hover:text-soft theme-light:border-stroke-strong theme-light:hover:bg-white/80"
            >
              Workspace
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
