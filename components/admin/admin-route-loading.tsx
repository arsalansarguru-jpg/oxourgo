'use client'

import { useLoadingTimeout } from '@/hooks/use-loading-timeout'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminRouteLoading() {
  const timedOut = useLoadingTimeout(true)

  if (timedOut) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Still loading">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-10 w-2/3 max-w-md rounded-xl" />
          <Skeleton className="h-4 w-full max-w-xl rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl border border-white/[0.06] bg-white/[0.04]" />
          ))}
        </div>
        <p className="text-xs text-muted">Still loading — slow connection. You can refresh if this persists.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-10 w-2/3 max-w-md rounded-xl" />
        <Skeleton className="h-4 w-full max-w-xl rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl border border-white/[0.06] bg-white/[0.04]" />
        ))}
      </div>
      <Skeleton className="h-14 w-full max-w-2xl rounded-2xl" />
    </div>
  )
}
