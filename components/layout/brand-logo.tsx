'use client'

import Image from 'next/image'
import { BRAND } from '@/constants/brand'
import { cn } from '@/lib/utils/cn'

type BrandLogoProps = {
  className?: string
  /** LCP / above-the-fold (e.g. main nav) */
  priority?: boolean
}

export function BrandLogo({ className, priority }: BrandLogoProps) {
  return (
    <Image
      src={BRAND.logoSrc}
      alt={BRAND.logoAlt}
      width={512}
      height={512}
      sizes="40px"
      priority={priority}
      className={cn('h-full w-full object-contain', className)}
    />
  )
}
