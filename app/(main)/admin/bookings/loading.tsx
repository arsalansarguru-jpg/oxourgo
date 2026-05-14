import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

export default function AdminBookingsLoading() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Bookings"
        title="Reservations"
        description="Loading reservations from Supabase…"
      />
      <AdminCard className="overflow-hidden">
        <AdminCardContent className="space-y-4 border-b border-white/[0.06] pb-5">
          <div className="h-12 max-w-md animate-pulse rounded-xl bg-white/[0.06] theme-light:bg-black/[0.06]" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-white/[0.06] theme-light:bg-black/[0.06]" />
            ))}
          </div>
        </AdminCardContent>
        <div className="space-y-3 p-4 sm:p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-white/[0.05] theme-light:bg-black/[0.05]"
            />
          ))}
        </div>
      </AdminCard>
    </div>
  )
}
