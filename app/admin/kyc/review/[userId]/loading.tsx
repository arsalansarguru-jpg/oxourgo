import { Skeleton } from '@/components/ui/skeleton'

/** KYC dossiers load large bundles + signed URLs — keep skeleton visible without a hard error state. */
export default function AdminKycReviewLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading KYC dossier">
      <div className="space-y-3">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-10 w-2/3 max-w-md rounded-xl" />
        <Skeleton className="h-4 w-full max-w-2xl rounded-lg" />
      </div>
      <Skeleton className="h-28 rounded-2xl" />
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[420px] rounded-2xl" />
        ))}
      </div>
      <p className="text-xs text-muted">Loading document panels and secure preview links…</p>
    </div>
  )
}
