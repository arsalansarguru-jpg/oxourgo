'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'

import { adminUploadVehicleImageAction } from '@/lib/admin/actions/vehicle-actions'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

type Props = {
  vehicleId: string
  className?: string
}

export function FleetVehicleHeroUpload({ vehicleId, className }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setError(null)
          setPending(true)
          const fd = new FormData()
          fd.append('vehicleId', vehicleId)
          fd.append('file', file)
          const r = await adminUploadVehicleImageAction(fd)
          setPending(false)
          e.target.value = ''
          if (!r.ok) {
            setError(r.message)
            console.error('[FleetVehicleHeroUpload]', r.message)
            return
          }
          router.refresh()
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="gap-2"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="h-4 w-4" aria-hidden />
        {pending ? 'Uploading…' : 'Upload hero image'}
      </Button>
      {error ? <p className="text-xs text-red-300 theme-light:text-red-700">{error}</p> : null}
      <p className="text-[11px] leading-relaxed text-muted">JPEG, PNG, WebP or GIF · up to 6MB · stored in fleet bucket</p>
    </div>
  )
}
