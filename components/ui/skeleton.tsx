import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-fill-glass-strong',
        'before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.35s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.07] before:to-transparent',
        className,
      )}
      {...props}
    />
  )
}
