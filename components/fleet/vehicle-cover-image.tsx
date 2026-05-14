'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

import { VEHICLE_IMAGE_FALLBACK } from '@/constants/vehicle-media'
import { cn } from '@/lib/utils/cn'

type VehicleCoverImageProps = {
  src: string
  alt: string
  sizes: string
  className?: string
  priority?: boolean
}

export function VehicleCoverImage({ src, alt, sizes, className, priority }: VehicleCoverImageProps) {
  const [current, setCurrent] = useState(src)

  useEffect(() => {
    setCurrent(src)
  }, [src])

  const onError = useCallback(() => {
    setCurrent(VEHICLE_IMAGE_FALLBACK)
  }, [])

  const remote = current.startsWith('http')
  const isSvg = current.endsWith('.svg')

  return (
    <Image
      src={current}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={remote || isSvg}
      onError={onError}
      className={cn(className)}
    />
  )
}
