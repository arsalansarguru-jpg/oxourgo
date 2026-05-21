import Link from 'next/link'

import { AdminKycFilterTabs } from '@/components/admin/admin-kyc-filter-tabs'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatusPill } from '@/components/admin/admin-status-pill'
import { Button } from '@/components/ui/Button'
import type { AdminKycListFilter } from '@/lib/admin/data/kyc'
import { adminListKycUserSummaries } from '@/lib/admin/data/kyc'

export const dynamic = 'force-dynamic'

const FILTERS: AdminKycListFilter[] = ['all', 'pending', 'approved', 'rejected', 'resubmission_required']

function parseFilter(tab: string | undefined): AdminKycListFilter {
  if (tab && FILTERS.includes(tab as AdminKycListFilter)) return tab as AdminKycListFilter
  return 'pending'
}

export default async function AdminKycPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const q = await searchParams
  const filter = parseFilter(q.tab)

  let rows: Awaited<ReturnType<typeof adminListKycUserSummaries>> = []
  try {
    rows = await adminListKycUserSummaries(filter)
  } catch {
    rows = []
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Compliance"
        title="KYC operations"
        description="Work the verification queue by lifecycle state. Open a dossier to inspect Aadhaar, license, PAN, and selfie over signed URLs, record reviewer attribution, and move customers toward approval without exposing vault files publicly."
      />

      <AdminKycFilterTabs active={filter} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <AdminCard key={row.user_id} className="border-stroke-strong transition-[box-shadow,transform] duration-300 hover:shadow-[0_18px_48px_-28px_rgba(56,189,248,0.35)]">
            <AdminCardContent className="flex flex-col gap-4 p-5 sm:p-6">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-base font-semibold tracking-tight text-soft">
                  {row.full_name}
                </p>
                <p className="truncate text-sm text-muted">{row.user_email ?? row.user_id}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <AdminStatusPill value={row.kyc_status} />
                </div>
                <p className="text-xs text-muted">
                  {row.kyc_submitted_at ? `Submitted ${new Date(row.kyc_submitted_at).toLocaleString()}` : 'No submit timestamp'}
                  {row.kyc_approved_at ? ` · Approved ${new Date(row.kyc_approved_at).toLocaleString()}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-stroke/80 pt-4">
                <Button type="button" size="sm" variant="secondary" to={`/admin/kyc/review/${row.user_id}`}>
                  Open dossier
                </Button>
                <Button type="button" size="sm" variant="ghost" to={`/admin/customers/${row.user_id}`}>
                  CRM
                </Button>
              </div>
            </AdminCardContent>
          </AdminCard>
        ))}
      </div>

      {rows.length === 0 ? (
        <AdminCard>
          <AdminCardContent className="space-y-2 p-6 text-sm text-muted">
            <p>No customers match this filter right now.</p>
            <p className="text-xs">
              Queue is built from uploaded documents (same source as dashboard KYC counts).{' '}
              <Link href="/admin/kyc?tab=all" className="text-electric underline-offset-4 hover:underline">
                View all activity
              </Link>
            </p>
          </AdminCardContent>
        </AdminCard>
      ) : null}
    </div>
  )
}
