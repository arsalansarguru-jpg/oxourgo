import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminKycReviewView } from '@/features/admin/kyc/admin-kyc-review-view'
import { adminGetKycUserReviewBundle } from '@/lib/admin/data/kyc'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

export default async function AdminKycReviewPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  let bundle: Awaited<ReturnType<typeof adminGetKycUserReviewBundle>> = null
  try {
    bundle = await adminGetKycUserReviewBundle(userId)
  } catch {
    bundle = null
  }
  if (!bundle) notFound()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <AdminPageHeader
          eyebrow="Compliance · Review"
          title="KYC dossier"
          description="Inspect vault files over short-lived signed links only. Approve when the license, government ID, and selfie meet policy; otherwise reject with a clear customer reason or request a targeted resubmission."
        />
        <Button type="button" variant="secondary" size="sm" to="/admin/kyc" className="shrink-0 self-start">
          ← Queue
        </Button>
      </div>
      <p className="text-xs text-muted">
        Customer{' '}
        <Link href={`/admin/customers/${userId}`} className="text-electric underline-offset-4 hover:underline">
          profile in CRM
        </Link>
      </p>
      <AdminKycReviewView bundle={bundle} />
    </div>
  )
}
