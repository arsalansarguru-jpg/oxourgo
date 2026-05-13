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
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  to,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        cardSurfaceDashed,
        'flex flex-col items-center justify-center bg-carbon/[0.4] px-5 py-12 text-center sm:px-8 sm:py-14',
        className,
      )}
    >
      <div
        className={cn(
          'mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-stroke bg-fill-glass text-electric shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h3 className={cn(cardTitle, 'text-center')}>{title}</h3>
      <p className={cn(cardBody, 'mt-2 max-w-md text-pretty')}>{description}</p>
      {actionLabel && onAction ? (
        <Button type="button" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
      {actionLabel && to && !onAction ? (
        <Button className="mt-6" to={to}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
