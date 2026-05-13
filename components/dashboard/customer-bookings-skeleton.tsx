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

export function CustomerBookingsSkeleton() {
  return (
    <div className="space-y-12">
      <div className="border-b border-white/[0.06] pb-8">
        <Shimmer className="h-3 w-28" />
        <Shimmer className="mt-4 h-9 w-64 max-w-full" />
        <Shimmer className="mt-4 h-4 w-full max-w-xl" />
        <Shimmer className="mt-2 h-4 w-full max-w-lg" />
      </div>
      <div className="space-y-3">
        <Shimmer className="h-3 w-24" />
        {[0, 1].map((i) => (
          <div
            key={i}
            className={cn(
              cardSurfaceBase,
              'grid gap-5 rounded-2xl border border-white/[0.08] p-5 sm:rounded-3xl sm:p-6 lg:grid-cols-[minmax(0,160px)_1fr]',
            )}
          >
            <Shimmer className="aspect-[16/10] w-full rounded-2xl lg:min-h-[140px]" />
            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
              <div className="flex-1 space-y-3">
                <Shimmer className="h-3 w-20" />
                <Shimmer className="h-6 w-3/5 max-w-sm" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Shimmer className="h-[4.5rem] rounded-xl" />
                  <Shimmer className="h-[4.5rem] rounded-xl" />
                  <Shimmer className="h-[4.5rem] rounded-xl sm:col-span-2" />
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 border-t border-white/[0.06] pt-4 lg:w-52 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <Shimmer className="h-3 w-14" />
                <Shimmer className="h-8 w-32" />
                <div className="flex gap-2">
                  <Shimmer className="h-7 w-24 rounded-full" />
                  <Shimmer className="h-7 w-28 rounded-full" />
                </div>
                <Shimmer className="h-11 w-full rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
