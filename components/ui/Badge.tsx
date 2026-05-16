import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

const variants = {
  default: 'bg-carbon-deep text-soft border-stroke',
  success: 'bg-emerald/10 text-emerald border-emerald/20',
  electric: 'bg-electric/10 text-electric border-electric/20',
  muted: 'bg-carbon-deep text-muted border-stroke',
  danger: 'bg-red-50 text-red-700 border-red-200 theme-dark:bg-red-500/15 theme-dark:text-red-200 theme-dark:border-red-500/35',
} as const

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
