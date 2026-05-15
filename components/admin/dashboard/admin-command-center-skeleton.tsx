import { AdminCard } from '@/components/admin/admin-card'

export function AdminCommandCenterSkeleton() {
  return (
    <div className="space-y-8 animate-pulse lg:space-y-10">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <AdminCard key={i} className="h-[7.5rem] border-white/[0.06] bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-12">
        <AdminCard className="h-44 border-white/[0.06] bg-white/[0.04] xl:col-span-5" />
        <AdminCard className="h-44 border-white/[0.06] bg-white/[0.04] xl:col-span-4" />
        <AdminCard className="h-44 border-white/[0.06] bg-white/[0.04] xl:col-span-3" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard className="h-80 border-white/[0.06] bg-white/[0.04]" />
        <AdminCard className="h-80 border-white/[0.06] bg-white/[0.04]" />
      </div>
    </div>
  )
}
