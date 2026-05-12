import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'
import { cardPadding, cardSurfaceBase, cardSurfaceTransition } from '@/components/ui/card-tokens'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(cardSurfaceBase, cardSurfaceTransition, className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-0 pt-5 sm:px-6 sm:pt-6', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(cardPadding, className)} {...props} />
}
