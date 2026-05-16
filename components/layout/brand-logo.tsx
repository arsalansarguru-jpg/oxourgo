'use client'

import Image from 'next/image'
import { BRAND } from '@/constants/brand'
import { cn } from '@/lib/utils/cn'

type BrandLogoProps = {
  className?: string
  /** LCP / above-the-fold (e.g. main nav) */
  priority?: boolean
  /** `lockup` = full brand image; `mark` = compact SVG monogram */
  variant?: 'lockup' | 'mark'
}

export function BrandLogo({ className, priority, variant = 'lockup' }: BrandLogoProps) {
  const src = variant === 'mark' ? BRAND.logoMarkSrc : BRAND.logoSrc

  return (
    <Image
      src={src}
      alt={BRAND.logoAlt}
      width={512}
      height={512}
      sizes={variant === 'mark' ? '40px' : '(max-width: 768px) 120px, 200px'}
      priority={priority}
      className={cn('object-contain', className)}
    />
  )
}
