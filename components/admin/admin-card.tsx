import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

const shell =
  'rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.055] to-white/[0.02] shadow-[var(--shadow-card)] backdrop-blur-xl ring-1 ring-inset ring-white/[0.035] transition-[box-shadow,border-color,ring-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'

const interactiveShell =
  'hover:border-white/[0.1] hover:shadow-[var(--shadow-card-hover)] hover:ring-white/[0.05]'

export type AdminCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'risk'
  interactive?: boolean
}

/** Glass data surface for admin — matches luxury dashboard panels. */
export function AdminCard({ className, variant = 'default', interactive, ...props }: AdminCardProps) {
  return (
    <div
      className={cn(
        shell,
        variant === 'risk' && 'border-red-500/22 ring-red-500/[0.08]',
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
