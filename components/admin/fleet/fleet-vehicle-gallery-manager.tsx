'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { ImagePlus, Star, Trash2 } from 'lucide-react'

import {
  adminAppendVehicleGalleryImagesAction,
  adminRemoveVehicleGalleryImageAction,
  adminSetVehicleCoverFromGalleryAction,
  adminUploadVehicleImageAction,
} from '@/lib/admin/actions/vehicle-actions'
import { fleetVehicleImageUrl } from '@/lib/admin/fleet-image-url'
import {
  galleryLabelDisplay,
  normalizeVehicleGalleryImages,
  VEHICLE_GALLERY_LABELS,
  type VehicleGalleryLabelId,
} from '@/lib/fleet/vehicle-gallery'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils/cn'

type Props = {
  vehicleId: string
  coverPath: string | null
  galleryImages: unknown
}

export function FleetVehicleGalleryManager({ vehicleId, coverPath, galleryImages }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [label, setLabel] = useState<VehicleGalleryLabelId>('exterior')

  const gallery = normalizeVehicleGalleryImages(galleryImages)
  const coverUrl = fleetVehicleImageUrl(coverPath)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Photo gallery</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Upload exterior, interior, dashboard, and other shots. Customers see these on the vehicle detail page when
          booking from the fleet.
        </p>
      </div>

      {coverUrl ? (
        <div className="relative h-40 w-full overflow-hidden rounded-xl border border-white/[0.08] sm:h-48">
          <Image src={coverUrl} alt="Cover" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" unoptimized />
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-matte/80 px-2 py-0.5 text-[10px] font-semibold text-electric backdrop-blur-sm">
            <Star className="h-3 w-3 fill-current" aria-hidden />
            Cover (listing hero)
          </span>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-stroke-strong px-3 py-4 text-xs text-muted">
          No cover image yet — upload gallery photos below or set a cover image.
        </p>
      )}

      {gallery.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((item) => {
            const url = fleetVehicleImageUrl(item.path)
            const isCover = coverPath === item.path
            return (
              <li
                key={item.path}
                className={cn(
                  'overflow-hidden rounded-xl border bg-matte/30',
                  isCover ? 'border-electric/45 ring-1 ring-electric/25' : 'border-white/[0.08]',
                )}
              >
                <div className="relative aspect-[4/3]">
                  {url ? (
                    <Image src={url} alt="" fill sizes="200px" className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">Missing</div>
                  )}
                  <span className="absolute bottom-1 left-1 rounded bg-matte/85 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-soft backdrop-blur-sm">
                    {galleryLabelDisplay(item.label)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 border-t border-white/[0.06] p-2">
                  {!isCover ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 flex-1 px-1 text-[10px]"
                      disabled={pending}
                      onClick={() => {
                        setError(null)
                        start(async () => {
                          const r = await adminSetVehicleCoverFromGalleryAction(vehicleId, item.path)
                          if (!r.ok) setError(r.message)
                          else router.refresh()
                        })
                      }}
                    >
                      Set cover
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-[10px] text-red-300"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm('Remove this image from the gallery?')) return
                      setError(null)
                      start(async () => {
                        const r = await adminRemoveVehicleGalleryImageAction(vehicleId, item.path)
                        if (!r.ok) setError(r.message)
                        else router.refresh()
                      })
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted">No gallery images yet.</p>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 theme-light:border-stroke-strong theme-light:bg-white/60">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Photo type"
            value={label}
            onChange={(e) => setLabel(e.target.value as VehicleGalleryLabelId)}
          >
            {VEHICLE_GALLERY_LABELS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
          <p className="self-end text-[11px] text-muted sm:col-span-1">
            JPEG, PNG, WebP or GIF · up to 6MB each · max 16 photos
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={(e) => {
            const files = e.target.files
            if (!files?.length) return
            setError(null)
            start(async () => {
              const fd = new FormData()
              fd.append('vehicleId', vehicleId)
              fd.append('label', label)
              for (const file of Array.from(files)) {
                fd.append('files', file)
              }
              const r = await adminAppendVehicleGalleryImagesAction(fd)
              e.target.value = ''
              if (!r.ok) setError(r.message)
              else router.refresh()
            })
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            {pending ? 'Uploading…' : 'Upload gallery photos'}
          </Button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setError(null)
              start(async () => {
                const fd = new FormData()
                fd.append('vehicleId', vehicleId)
                fd.append('file', file)
                const r = await adminUploadVehicleImageAction(fd)
                e.target.value = ''
                if (!r.ok) setError(r.message)
                else router.refresh()
              })
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => coverInputRef.current?.click()}
          >
            Replace cover only
          </Button>
        </div>
      </div>

      {error ? <p className="text-xs text-red-300 theme-light:text-red-700">{error}</p> : null}
    </div>
  )
}
