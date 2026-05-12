import { AdminKycActions } from '@/components/admin/admin-kyc-actions'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { adminListKycDocuments } from '@/lib/admin/data/kyc'
import { formatKycDocumentType } from '@/lib/kyc/doc-label'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

export const dynamic = 'force-dynamic'

export default async function AdminKycPage() {
  let rows: Awaited<ReturnType<typeof adminListKycDocuments>> = []
  try {
    rows = await adminListKycDocuments()
  } catch {
    rows = []
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Compliance"
        title="KYC queue"
        description="Review uploads with signed URLs, transition statuses, and emit audit events. Profile tier auto-promotes when all documents are approved."
      />

      <div className="space-y-4">
        {rows.map((row) => (
          <Card key={row.id} className={cn(cardSurfaceBase, 'border border-white/[0.08]')}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-electric/90">{formatKycDocumentType(row.document_type)}</p>
                <p className="font-medium text-soft">{row.user_email ?? row.user_id}</p>
                <p className="font-mono text-xs text-muted">{row.id}</p>
                <p className="text-xs text-muted">
                  Updated {new Date(row.updated_at).toLocaleString()}
                  {row.reviewed_at ? ` · Reviewed ${new Date(row.reviewed_at).toLocaleString()}` : ''}
                </p>
                {row.reviewer_note ? (
                  <p className="text-sm text-muted">
                    <span className="font-medium text-soft">Note: </span>
                    {row.reviewer_note}
                  </p>
                ) : null}
              </div>
              <AdminKycActions row={row} />
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 ? (
          <Card className={cn(cardSurfaceBase, 'border border-white/[0.08]')}>
            <CardContent className="p-6 text-sm text-muted">No KYC rows loaded.</CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
