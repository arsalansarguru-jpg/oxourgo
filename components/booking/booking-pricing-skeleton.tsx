import { cn } from '@/lib/utils/cn'
import {
  cardPadding,
  cardSurfaceBase,
  cardSurfaceTransition,
} from '@/components/ui/card-tokens'

type Props = {
  className?: string
}

export function BookingPricingSkeleton({ className }: Props) {
  return (
    <div
      className={cn(
        cardSurfaceBase,
        cardSurfaceTransition,
        cardPadding,
        'backdrop-blur-sm',
        className,
      )}
      aria-busy
      aria-label="Calculating pricing"
    >
      <div className="space-y-3.5">
        <div className="h-3 w-[40%] animate-pulse rounded bg-fill-glass-strong" />
        <div className="h-3 w-[72%] animate-pulse rounded bg-fill-glass-strong" />
        <div className="h-3 w-[55%] animate-pulse rounded bg-fill-glass-strong" />
        <div className="h-3 w-[48%] animate-pulse rounded bg-fill-glass-strong" />
      </div>
      <div className="mt-5 flex justify-between border-t border-stroke pt-4">
        <div className="h-4 w-16 animate-pulse rounded bg-fill-glass-strong" />
        <div className="h-4 w-24 animate-pulse rounded bg-fill-glass-strong" />
      </div>
    </div>
  )
}
