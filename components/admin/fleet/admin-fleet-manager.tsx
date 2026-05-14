'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'

import { FleetAddVehicleModal } from '@/components/admin/fleet/fleet-add-vehicle-modal'
import { FleetEditVehicleModal } from '@/components/admin/fleet/fleet-edit-vehicle-modal'
import { FleetUtilizationHero } from '@/components/admin/fleet/fleet-utilization-hero'
import { FleetVehicleCard } from '@/components/admin/fleet/fleet-vehicle-card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { AdminFleetDashboardMetrics, AdminVehicleRow } from '@/lib/admin/data/fleet'
import { cn } from '@/lib/utils/cn'

type AvailabilityFilter = 'all' | 'bookable' | 'offline'

type Props = {
  vehicles: AdminVehicleRow[]
  metrics: AdminFleetDashboardMetrics
  initialOpenAdd?: boolean
}

export function AdminFleetManager({ vehicles, metrics, initialOpenAdd }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [availability, setAvailability] = useState<AvailabilityFilter>('all')
  const [addOpen, setAddOpen] = useState(Boolean(initialOpenAdd))
  const [editVehicle, setEditVehicle] = useState<AdminVehicleRow | null>(null)

  useEffect(() => {
    if (initialOpenAdd) setAddOpen(true)
  }, [initialOpenAdd])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return vehicles.filter((v) => {
      if (availability === 'bookable' && v.available === false) return false
      if (availability === 'offline' && v.available !== false) return false
      if (!q) return true
      const blob = [v.name, v.brand, v.registration_number, v.id, v.fuel_type, v.transmission].join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [vehicles, search, availability])

  const closeAdd = () => {
    setAddOpen(false)
    if (initialOpenAdd) {
      router.replace('/admin/fleet')
    }
  }

  return (
    <div className="space-y-8">
      <FleetUtilizationHero metrics={metrics} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <Input
            label="Search fleet"
            placeholder="Name, brand, registration, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md border-white/[0.08] bg-white/[0.04] shadow-none theme-light:bg-white/80"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all' as const, label: 'All' },
              { id: 'bookable' as const, label: 'Bookable' },
              { id: 'offline' as const, label: 'Offline' },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setAvailability(chip.id)}
              className={cn(
                'rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-[background-color,border-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                availability === chip.id
                  ? 'border-electric/45 bg-electric/18 text-electric shadow-[0_0_24px_-10px_rgba(59,130,246,0.55)]'
                  : 'border-white/[0.08] bg-white/[0.03] text-muted hover:border-white/[0.12] hover:bg-white/[0.055] hover:text-soft theme-light:border-stroke-strong theme-light:bg-white/70',
              )}
            >
              {chip.label}
            </button>
          ))}
          <Button type="button" className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add vehicle
          </Button>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent px-6 py-20 text-center shadow-[var(--shadow-card)] backdrop-blur-xl theme-light:border-stroke-strong theme-light:from-white theme-light:to-white/60">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05] theme-light:border-stroke">
            <Search className="h-7 w-7 text-muted" aria-hidden />
          </div>
          <div className="max-w-md space-y-2">
            <p className="text-lg font-semibold text-soft">Your fleet is empty</p>
            <p className="text-sm leading-relaxed text-muted">
              Create the first catalog vehicle to power the storefront, availability engine, and admin bookings.
            </p>
          </div>
          <Button type="button" onClick={() => setAddOpen(true)}>
            Add first vehicle
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-14 text-center theme-light:border-stroke-strong theme-light:bg-white/80">
          <p className="font-medium text-soft">No vehicles match this view</p>
          <p className="mt-2 text-sm text-muted">Clear search or switch availability filters.</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-6"
            onClick={() => {
              setSearch('')
              setAvailability('all')
            }}
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <FleetVehicleCard key={v.id} vehicle={v} onEdit={() => setEditVehicle(v)} />
          ))}
        </div>
      )}

      <FleetAddVehicleModal open={addOpen} onClose={closeAdd} />
      <FleetEditVehicleModal vehicle={editVehicle} onClose={() => setEditVehicle(null)} />
    </div>
  )
}
