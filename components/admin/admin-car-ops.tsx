'use client'

import { useRouter } from 'next/navigation'
import { useOptimistic, useTransition, useState } from 'react'

import {
  adminAppendGalleryImageAction,
  adminDeleteCarAction,
  adminSetCarAvailabilityAction,
  adminToggleFeaturedAction,
  adminUploadCarCoverAction,
} from '@/lib/admin/actions/fleet-actions'
import type { CarRow } from '@/lib/supabase/database.types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

export function AdminCarOps({ car }: { car: CarRow }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [optimisticFeatured, addFeatured] = useOptimistic(car.featured, (_prev, next: boolean) => next)

  return (
    <div className="space-y-6">
      <Card className={cn(cardSurfaceBase, 'border border-white/[0.08]')}>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-soft">Listing controls</h2>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-soft">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-matte"
                checked={optimisticFeatured}
                disabled={pending}
                onChange={() => {
                  const next = !optimisticFeatured
                  start(async () => {
                    addFeatured(next)
                    const r = await adminToggleFeaturedAction(car.id, next)
                    if (!r.ok) {
                      setMsg(r.message)
                      addFeatured(!next)
                    }
                    router.refresh()
                  })
                }}
              />
              Featured
            </label>
            <form
              className="flex flex-wrap items-end gap-2"
              action={(fd) => {
                setMsg(null)
                start(async () => {
                  const v = String(fd.get('availability_status') ?? '')
                  const r = await adminSetCarAvailabilityAction(car.id, v)
                  if (!r.ok) setMsg(r.message)
                  router.refresh()
                })
              }}
            >
              <Select name="availability_status" label="Availability" defaultValue={car.availability_status}>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="maintenance">Maintenance</option>
              </Select>
              <Button type="submit" variant="secondary" size="sm" disabled={pending}>
                Update
              </Button>
            </form>
          </div>
          {msg ? <p className="text-sm text-red-300">{msg}</p> : null}
        </CardContent>
      </Card>

      <Card className={cn(cardSurfaceBase, 'border border-white/[0.08]')}>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-soft">Images (fleet bucket)</h2>
          <form
            className="flex flex-wrap items-end gap-3"
            encType="multipart/form-data"
            action={(fd) => {
              setMsg(null)
              fd.append('carId', car.id)
              start(async () => {
                const r = await adminUploadCarCoverAction(fd)
                if (!r.ok) setMsg(r.message)
                router.refresh()
              })
            }}
          >
            <Input name="file" label="Cover image" type="file" accept="image/*" required disabled={pending} />
            <Button type="submit" variant="secondary" disabled={pending}>
              Upload cover
            </Button>
          </form>
          <form
            className="flex flex-wrap items-end gap-3"
            encType="multipart/form-data"
            action={(fd) => {
              setMsg(null)
              fd.append('carId', car.id)
              start(async () => {
                const r = await adminAppendGalleryImageAction(fd)
                if (!r.ok) setMsg(r.message)
                router.refresh()
              })
            }}
          >
            <Input name="file" label="Gallery image" type="file" accept="image/*" required disabled={pending} />
            <Button type="submit" variant="secondary" disabled={pending}>
              Add to gallery
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className={cn(cardSurfaceBase, 'border border-red-500/20')}>
        <CardContent className="space-y-3 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-red-200">Danger zone</h2>
          <p className="text-sm text-muted">Deletes the row if no foreign keys block it (existing bookings will block).</p>
          <Button
            variant="danger"
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm('Delete this vehicle from the fleet?')) return
              start(async () => {
                const r = await adminDeleteCarAction(car.id)
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
