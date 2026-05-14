import { Star } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

type Props = {
  rating: number
  count: number
  className?: string
}

/** Homepage / fleet review line — muted empty state when there are no reviews (H2). */
export function ReviewBadge({ rating, count, className }: Props) {
  if (!count || count <= 0) {
    return <span className={cn('text-xs text-muted', className)}>No reviews yet</span>
  }
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-muted', className)}>
      <Star className="h-3.5 w-3.5 shrink-0 fill-electric/25 text-electric" aria-hidden />
      <span className="font-semibold tabular-nums text-soft">{rating.toFixed(1)}</span>
      <span aria-hidden className="text-silver/60">
        ·
      </span>
      <span className="tabular-nums text-muted">
        {count} {count === 1 ? 'review' : 'reviews'}
      </span>
    </span>
  )
}
