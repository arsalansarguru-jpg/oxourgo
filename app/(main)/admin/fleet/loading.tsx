import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

export default function AdminFleetLoading() {
  return (
    <div className="space-y-8">
      <AdminPageHeader eyebrow="Fleet" title="Fleet studio" description="Loading fleet data…" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <AdminCard key={i} className="overflow-hidden">
            <AdminCardContent className="p-5">
              <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06] theme-light:bg-black/[0.06]" />
              <div className="mt-4 h-10 w-20 animate-pulse rounded-lg bg-white/[0.06] theme-light:bg-black/[0.06]" />
            </AdminCardContent>
          </AdminCard>
        ))}
      </div>
      <AdminCard>
        <AdminCardContent className="space-y-4">
          <div className="h-12 max-w-md animate-pulse rounded-xl bg-white/[0.06] theme-light:bg-black/[0.06]" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-white/[0.06] theme-light:bg-black/[0.06]" />
            ))}
          </div>
        </AdminCardContent>
      </AdminCard>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/[0.05] theme-light:bg-black/[0.05]" />
        ))}
      </div>
    </div>
  )
}
