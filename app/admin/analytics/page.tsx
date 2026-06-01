import { AdminAnalyticsDashboard } from '@/components/admin/analytics/admin-analytics-dashboard'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { fetchAdminAnalyticsBundle } from '@/lib/admin/data/analytics'
import { adminPageMetadata } from '@/lib/admin/page-metadata'
import { resolveAnalyticsRangeFromSearchParams } from '@/lib/admin/analytics-range'

export const dynamic = 'force-dynamic'

export const metadata = adminPageMetadata('Analytics')

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const range = resolveAnalyticsRangeFromSearchParams(raw)
  const data = await fetchAdminAnalyticsBundle(range)

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Intelligence"
        title="Analytics"
        description="Revenue, fleet load, and booking intelligence sourced from live Supabase data. Presets and custom ranges use IST business-day boundaries."
      />
      <AdminAnalyticsDashboard data={data} />
    </div>
  )
}
