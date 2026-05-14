import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { cardBody, cardSurfaceDashed, cardTitle } from '@/components/ui/card-tokens'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  /** Internal next/link href when no `onAction` */
  to?: string
  className?: string
  /** Tighter layout for nested sections (e.g. booking groups). */
  size?: 'default' | 'compact'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  to,
  className,
  size = 'default',
}: EmptyStateProps) {
  const compact = size === 'compact'
  return (
    <div
      className={cn(
        cardSurfaceDashed,
        'flex flex-col items-center justify-center bg-carbon/[0.4] text-center',
        compact ? 'px-4 py-8 sm:px-6 sm:py-10' : 'px-5 py-12 sm:px-8 sm:py-14',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl border border-stroke bg-fill-glass text-electric shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
          compact ? 'mb-3 h-11 w-11' : 'mb-5 h-14 w-14',
        )}
      >
        <Icon className={compact ? 'h-5 w-5' : 'h-7 w-7'} aria-hidden />
      </div>
      <h3 className={cn(cardTitle, 'text-center', compact && 'text-base')}>{title}</h3>
      <p className={cn(cardBody, 'mt-2 max-w-md text-pretty', compact && 'text-sm')}>{description}</p>
      {actionLabel && onAction ? (
        <Button type="button" className={compact ? 'mt-4' : 'mt-6'} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
      {actionLabel && to && !onAction ? (
        <Button className={compact ? 'mt-4' : 'mt-6'} to={to}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
