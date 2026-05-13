import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-white/[0.06] via-white/[0.12] to-white/[0.06] bg-[length:200%_100%]',
        className,
      )}
      aria-hidden
    />
  )
}

export function CustomerBookingDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border border-white/[0.09]">
        <Shimmer className="aspect-[21/10] w-full min-h-[200px] rounded-none md:min-h-[280px]" />
        <div className="space-y-3 border-t border-white/[0.08] bg-matte/80 p-6 md:p-8">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-10 w-2/3 max-w-md" />
          <div className="flex flex-wrap gap-2 pt-2">
            <Shimmer className="h-7 w-28 rounded-full" />
            <Shimmer className="h-7 w-32 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className={cn(cardSurfaceBase, 'rounded-2xl border border-white/[0.08] p-6 sm:rounded-3xl')}>
            <Shimmer className="h-5 w-40" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((k) => (
                <Shimmer key={k} className="h-24 rounded-2xl" />
              ))}
            </div>
          </div>
          <Shimmer className="h-48 rounded-2xl sm:rounded-3xl" />
        </div>
        <div className="space-y-4">
          <Shimmer className="h-40 rounded-2xl sm:rounded-3xl" />
          <Shimmer className="h-36 rounded-2xl sm:rounded-3xl" />
        </div>
      </div>
    </div>
  )
}
