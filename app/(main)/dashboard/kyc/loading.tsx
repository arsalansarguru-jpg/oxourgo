import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

export default function KycCenterLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded-full bg-fill-glass-strong" />
        <div className="h-9 w-48 max-w-full animate-pulse rounded-lg bg-fill-glass-strong" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-fill-glass-strong" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-fill-glass-strong" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(cardSurfaceBase, 'h-64 animate-pulse rounded-2xl border border-stroke bg-fill-glass-strong/80')}
          />
        ))}
      </div>
    </div>
  )
}
