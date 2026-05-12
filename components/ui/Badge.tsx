import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

const variants = {
  default: 'bg-white/10 text-soft border-white/15',
  success: 'bg-emerald/15 text-emerald border-emerald/25',
  electric: 'bg-electric/15 text-electric border-electric/30',
  muted: 'bg-white/5 text-silver border-white/10',
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
