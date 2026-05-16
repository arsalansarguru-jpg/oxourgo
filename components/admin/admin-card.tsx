import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

const shell =
  'rounded-lg border border-stroke bg-carbon shadow-[var(--shadow-card)]'

const interactiveShell = 'hover:border-stroke-strong hover:shadow-[var(--shadow-card-hover)]'

export type AdminCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'risk'
  interactive?: boolean
}

export function AdminCard({ className, variant = 'default', interactive, ...props }: AdminCardProps) {
  return (
    <div
      className={cn(
        shell,
        variant === 'risk' && 'border-red-200 bg-red-50/50 theme-dark:border-red-500/30 theme-dark:bg-red-500/10',
        interactive && interactiveShell,
        className,
      )}
      {...props}
    />
  )
}

export function AdminCardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 sm:p-6', className)} {...props} />
}
