import { Skeleton } from '@/components/ui/skeleton'

export default function KycLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-9 w-full max-w-md rounded-xl" />
        <p className="text-sm font-medium text-electric/90">Loading KYC center…</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
