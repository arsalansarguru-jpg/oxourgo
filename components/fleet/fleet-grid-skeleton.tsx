import { CarCardSkeleton } from '@/components/ui/LoadingSkeleton'
import { cn } from '@/lib/utils/cn'

type FleetGridSkeletonProps = {
  count?: number
  className?: string
}

export function FleetGridSkeleton({ count = 9, className }: FleetGridSkeletonProps) {
  return (
    <div
      className={cn(
        'grid gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3 lg:gap-8',
        className,
      )}
      aria-busy
      aria-label="Loading vehicles"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  )
}
