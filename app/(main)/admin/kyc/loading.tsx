import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

export default function AdminKycLoading() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Compliance"
        title="KYC operations"
        description="Loading verification queue…"
      />
      <div className="h-12 max-w-xl animate-pulse rounded-2xl bg-fill-glass-strong" aria-hidden />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <AdminCard key={i}>
            <AdminCardContent className="space-y-3 p-5">
              <div className="h-4 w-48 animate-pulse rounded bg-fill-glass-strong" />
              <div className="h-3 w-full animate-pulse rounded bg-fill-glass-strong" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-fill-glass-strong" />
            </AdminCardContent>
          </AdminCard>
        ))}
      </div>
    </div>
  )
}
