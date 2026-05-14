'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

import { VEHICLE_IMAGE_FALLBACK } from '@/constants/vehicle-media'
import { shouldOptimizeVehicleImageSrc } from '@/lib/fleet/vehicle-image-src'
import { cn } from '@/lib/utils/cn'

type VehicleCoverImageProps = {
  src: string
  alt: string
  sizes: string
  className?: string
  priority?: boolean
}

export function VehicleCoverImage({ src, alt, sizes, className, priority }: VehicleCoverImageProps) {
  const [current, setCurrent] = useState(() => (src?.trim() ? src.trim() : VEHICLE_IMAGE_FALLBACK))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setCurrent(src?.trim() ? src.trim() : VEHICLE_IMAGE_FALLBACK)
    setLoaded(false)
  }, [src])

  const onError = useCallback(() => {
    setCurrent(VEHICLE_IMAGE_FALLBACK)
    setLoaded(true)
  }, [])

  const unoptimized = !shouldOptimizeVehicleImageSrc(current) || current.endsWith('.svg')

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
        src={current}
        alt={alt}
        fill
        sizes={sizes}
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
