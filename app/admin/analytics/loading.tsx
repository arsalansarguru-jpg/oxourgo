import { AdminCard } from '@/components/admin/admin-card'
import { cn } from '@/lib/utils/cn'

export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-8 animate-pulse lg:space-y-10">
      <div className="space-y-3">
        <div className="h-3 w-28 rounded-full bg-white/[0.08]" />
        <div className="h-9 w-56 max-w-full rounded-lg bg-white/[0.08]" />
        <div className="h-4 w-full max-w-2xl rounded bg-white/[0.06]" />
      </div>
      <div className="h-16 rounded-2xl bg-white/[0.06]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <AdminCard key={i} className="h-32 border-white/[0.06] bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <AdminCard key={i} className={cn('h-28 border-white/[0.06] bg-white/[0.04]', i === 3 && 'sm:col-span-2 lg:col-span-3')} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <AdminCard key={i} className={cn('h-72 border-white/[0.06] bg-white/[0.04]', i === 3 && 'xl:col-span-2')} />
        ))}
      </div>
      <AdminCard className="h-64 border-white/[0.06] bg-white/[0.04]" />
    </div>
  )
}
