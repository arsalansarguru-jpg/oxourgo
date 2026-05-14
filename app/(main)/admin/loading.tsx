import { Skeleton } from '@/components/ui/skeleton'

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-10 w-2/3 max-w-md rounded-xl" />
        <Skeleton className="h-4 w-full max-w-xl rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl border border-white/[0.06] bg-white/[0.04]" />
        ))}
      </div>
      <Skeleton className="h-14 w-full max-w-2xl rounded-2xl" />
    </div>
  )
}
