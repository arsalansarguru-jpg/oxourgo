import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

const variants = {
  default: 'bg-fill-glass-strong text-soft border-stroke-strong',
  success: 'bg-emerald/15 text-emerald border-emerald/25',
  electric: 'bg-electric/15 text-electric border-electric/30',
  muted: 'bg-fill-glass text-silver border-stroke',
  danger: 'bg-red-500/15 text-red-200 border-red-500/35',
} as const

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
