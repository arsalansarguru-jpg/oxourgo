'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

import { VEHICLE_IMAGE_FALLBACK } from '@/constants/vehicle-media'
import { shouldOptimizeVehicleImageSrc } from '@/lib/fleet/vehicle-image-src'
import { cn } from '@/lib/utils/cn'

/** Default `sizes` for fleet grid cards (single column mobile, multi-column desktop). */
const DEFAULT_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 420px'

/** Detail gallery strip thumbnails. */
const THUMB_SIZES = '108px'

export type FleetVehicleImgProps = {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
  /** Passed to `next/image` — override for tight thumbnails. */
  sizes?: string
  priority?: boolean
  /** `thumbnail` uses smaller `sizes` for the car detail strip. */
  variant?: 'card' | 'thumbnail'
}

export function FleetVehicleImg({
  src,
  alt,
  className,
  loading = 'lazy',
  sizes,
  priority,
  variant = 'card',
}: FleetVehicleImgProps) {
  const [url, setUrl] = useState(() => (src?.trim() ? src.trim() : VEHICLE_IMAGE_FALLBACK))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setUrl(src?.trim() ? src.trim() : VEHICLE_IMAGE_FALLBACK)
    setLoaded(false)
  }, [src])

  const onError = useCallback(() => {
    setUrl(VEHICLE_IMAGE_FALLBACK)
    setLoaded(true)
  }, [])

  const resolvedSizes = sizes ?? (variant === 'thumbnail' ? THUMB_SIZES : DEFAULT_SIZES)
  const unoptimized = !shouldOptimizeVehicleImageSrc(url) || url.endsWith('.svg')

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-carbon-deep"
        aria-hidden
      >
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-r from-fill-glass/[0.12] via-transparent to-fill-glass/[0.12] transition-opacity duration-500 ease-out',
            loaded ? 'opacity-0' : 'opacity-100 motion-safe:animate-pulse',
          )}
        />
      </div>
      <Image
        src={url}
        alt={alt}
        fill
        sizes={resolvedSizes}
        loading={loading}
        priority={priority}
        decoding="async"
        referrerPolicy="no-referrer"
        unoptimized={unoptimized}
        onLoadingComplete={() => setLoaded(true)}
        onError={onError}
        className={cn(
          'z-[1] object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
      />
    </>
  )
}
