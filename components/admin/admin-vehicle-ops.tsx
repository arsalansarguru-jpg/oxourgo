'use client'

import { useRouter } from 'next/navigation'
import { useOptimistic, useState, useTransition } from 'react'

import {
  adminDeleteVehicleAction,
  adminSetVehicleAvailableAction,
  adminToggleVehicleFeaturedAction,
} from '@/lib/admin/actions/vehicle-actions'
import type { AdminVehicleRow } from '@/lib/admin/data/fleet'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

export function AdminVehicleOps({ vehicle }: { vehicle: AdminVehicleRow }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const initialAvailable = vehicle.available !== false
  const [optimisticFeatured, addFeatured] = useOptimistic(vehicle.featured, (_p, n: boolean) => n)
  const [optimisticAvailable, addAvailable] = useOptimistic(initialAvailable, (_p, n: boolean) => n)

  return (
    <div className="space-y-6">
      <Card className={cn(cardSurfaceBase, 'border border-stroke')}>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-soft">Listing controls</h2>
          <p className="text-sm text-muted">
            Toggle public availability and homepage featuring. Pricing lives in the details card.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-stroke bg-fill-glass px-4 py-3 text-sm text-soft">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-stroke-strong bg-matte text-electric"
                checked={optimisticAvailable}
                disabled={pending}
                onChange={() => {
                  const next = !optimisticAvailable
                  setMsg(null)
                  start(async () => {
                    addAvailable(next)
                    const r = await adminSetVehicleAvailableAction(vehicle.id, next)
                    if (!r.ok) {
                      setMsg(r.message)
                      addAvailable(!next)
                      return
                    }
                    router.refresh()
                  })
                }}
              />
              Available for booking
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-stroke bg-fill-glass px-4 py-3 text-sm text-soft">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-stroke-strong bg-matte text-electric"
                checked={optimisticFeatured}
                disabled={pending}
                onChange={() => {
                  const next = !optimisticFeatured
                  setMsg(null)
                  start(async () => {
                    addFeatured(next)
                    const r = await adminToggleVehicleFeaturedAction(vehicle.id, next)
                    if (!r.ok) {
                      setMsg(r.message)
                      addFeatured(!next)
                      return
                    }
                    router.refresh()
                  })
                }}
              />
              Featured on fleet
            </label>
          </div>
          {msg ? <p className="text-sm text-red-300">{msg}</p> : null}
        </CardContent>
      </Card>

      <Card className={cn(cardSurfaceBase, 'border border-red-500/20')}>
        <CardContent className="space-y-3 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-red-200">Danger zone</h2>
          <p className="text-sm text-muted">
            Deletes this catalog row. Bookings referencing this vehicle may block deletion until re-pointed.
          </p>
          <Button
            variant="danger"
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm('Delete this vehicle from the catalog?')) return
              start(async () => {
                const r = await adminDeleteVehicleAction(vehicle.id)
                if (!r.ok) {
                  setMsg(r.message)
                  return
                }
                router.replace('/admin/fleet')
                router.refresh()
              })
            }}
          >
            Remove vehicle
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
