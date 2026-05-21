import type { HTMLAttributes } from 'react'

import { adminKpiGlow } from '@/lib/design/admin-actions'
import { cn } from '@/lib/utils/cn'

const shell =
  'rounded-2xl border border-stroke bg-fill-glass-strong shadow-[var(--shadow-card)] backdrop-blur-2xl'

const interactiveShell =
  'transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-electric/30 hover:shadow-[var(--shadow-card-hover)]'

export type AdminCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'risk' | 'critical' | 'glow'
  interactive?: boolean
}

export function AdminCard({ className, variant = 'default', interactive, ...props }: AdminCardProps) {
  return (
    <div
      className={cn(
        shell,
        variant === 'glow' && adminKpiGlow.default,
        variant === 'risk' &&
          'border-amber-400/30 bg-amber-500/10 theme-light:border-amber-400/40 theme-light:bg-amber-50/90',
        variant === 'critical' && cn(adminKpiGlow.critical, 'border-red-500/50 bg-red-500/10'),
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
