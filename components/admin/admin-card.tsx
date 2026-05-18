import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

const shell =
  'rounded-2xl border border-white/[0.08] bg-white/[0.045] shadow-[var(--shadow-card)] backdrop-blur'

const interactiveShell = 'hover:border-white/[0.14] hover:bg-white/[0.065] hover:shadow-[var(--shadow-card-hover)]'

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
  return <div className={cn('p-4 sm:p-5 lg:p-6', className)} {...props} />
}
