import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'

export default function AdminKycReviewLoading() {
  return (
    <div className="space-y-8">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-fill-glass-strong" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <AdminCard key={i}>
            <AdminCardContent className="space-y-4 p-5 sm:p-6">
              <div className="h-5 w-40 animate-pulse rounded bg-fill-glass-strong" />
              <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-fill-glass-strong" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-fill-glass-strong" />
            </AdminCardContent>
          </AdminCard>
        ))}
      </div>
    </div>
  )
}
