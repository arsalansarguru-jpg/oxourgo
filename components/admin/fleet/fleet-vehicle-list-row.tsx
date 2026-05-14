'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useOptimistic, useState, useTransition } from 'react'
import { Gauge, Pencil } from 'lucide-react'

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

export function FleetVehicleListRow({ vehicle, onEdit }: Props) {
  const router = useRouter()
  const thumb = fleetVehicleImageUrl(vehicle.image)
  const initialAvailable = vehicle.available !== false
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [optimisticFeatured, setFeatured] = useOptimistic(vehicle.featured, (_p, n: boolean) => n)
  const [optimisticAvailable, setAvailable] = useOptimistic(initialAvailable, (_p, n: boolean) => n)
  const busy = pending

  const city = vehicle.city?.trim()

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-white/[0.06] to-white/[0.02] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl ring-1 ring-inset ring-white/[0.04] transition-[border-color,box-shadow] duration-300 sm:flex-row sm:items-center sm:gap-5 sm:p-4',
        'theme-light:border-stroke-strong theme-light:from-white/90 theme-light:to-white/70 theme-light:ring-black/[0.04]',
      )}
    >
      <button
        type="button"
        onClick={onEdit}
        className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl border border-white/[0.06] sm:aspect-auto sm:h-[72px] sm:w-[112px] theme-light:border-stroke"
      >
        {thumb ? (
          <Image src={thumb} alt="" fill sizes="200px" className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full min-h-[100px] w-full items-center justify-center bg-carbon-deep text-xs text-muted sm:min-h-0">
            No image
          </div>
        )}
        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.12] bg-matte/60 text-soft backdrop-blur-md sm:hidden">
          <Pencil className="h-3.5 w-3.5" aria-hidden />
        </span>
      </button>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <AdminStatusPill value={optimisticAvailable ? 'available' : 'unavailable'} />
          {optimisticFeatured ? (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100 theme-light:text-amber-900">
              Featured
            </span>
          ) : null}
        </div>
        <div>
          <p className="truncate text-base font-semibold tracking-[-0.02em] text-soft">
            {vehicle.brand} {vehicle.name}
          </p>
          <p className="truncate text-xs text-muted">
            {[city, vehicle.year, vehicle.registration_number].filter(Boolean).join(' · ')}
          </p>
        </div>
        <p className="text-xs text-muted">
          {vehicle.seats} seats · {vehicle.transmission} · {vehicle.fuel_type}
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        <div className="grid grid-cols-2 gap-2 text-right sm:block sm:space-y-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Daily</p>
            <p className="tabular-nums text-sm font-semibold text-soft">{formatInr(vehicle.price_per_day)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Deposit</p>
            <p className="tabular-nums text-sm font-semibold text-soft">{formatInr(vehicle.security_deposit)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-soft">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-stroke-strong bg-matte text-electric theme-light:bg-white"
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
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-soft">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-stroke-strong bg-matte text-electric theme-light:bg-white"
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
        {msg ? <p className="text-right text-xs text-red-300 theme-light:text-red-700">{msg}</p> : null}

        <div className="flex flex-wrap gap-2 pt-1 sm:justify-end">
          <button
            type="button"
            onClick={onEdit}
            className="hidden items-center gap-2 rounded-xl border border-stroke-strong bg-fill-glass-strong px-3 py-2 text-xs font-semibold text-soft transition-colors hover:border-electric/35 hover:bg-electric/[0.08] sm:inline-flex theme-light:bg-white/80"
          >
            <Gauge className="h-3.5 w-3.5 text-electric" aria-hidden />
            Manage
          </button>
          <Link
            href={`/admin/fleet/${vehicle.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-white/[0.14] hover:text-soft theme-light:border-stroke-strong"
          >
            Workspace
          </Link>
        </div>
      </div>
    </div>
  )
}
