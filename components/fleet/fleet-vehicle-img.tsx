'use client'

import { useCallback, useEffect, useState } from 'react'

import { VEHICLE_IMAGE_FALLBACK } from '@/constants/vehicle-media'
import { cn } from '@/lib/utils/cn'

type FleetVehicleImgProps = {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

export function FleetVehicleImg({ src, alt, className, loading = 'lazy' }: FleetVehicleImgProps) {
  const [url, setUrl] = useState(src)

  useEffect(() => {
    setUrl(src)
  }, [src])

  const onError = useCallback(() => {
    setUrl(VEHICLE_IMAGE_FALLBACK)
  }, [])

  return (
    // eslint-disable-next-line @next/next/no-img-element -- dynamic Supabase URLs + reliable onError fallback
    <img
      src={url}
      alt={alt}
      className={cn(className)}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={onError}
    />
  )
}
