import { cn } from '@/lib/utils/cn'

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-fill-glass',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.4s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent',
        className,
      )}
    />
  )
}

export function CarCardSkeleton() {
  return (
    <div className="rounded-2xl border border-stroke bg-carbon/60 p-3">
      <LoadingSkeleton className="mb-4 aspect-[16/10] w-full" />
      <LoadingSkeleton className="mb-2 h-5 w-2/3" />
      <LoadingSkeleton className="mb-4 h-4 w-1/2" />
      <div className="flex gap-2">
        <LoadingSkeleton className="h-8 flex-1" />
        <LoadingSkeleton className="h-8 w-24" />
      </div>
    </div>
  )
}
