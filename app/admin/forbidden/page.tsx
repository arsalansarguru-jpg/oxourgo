import type { Metadata } from 'next'

import { PermissionDenied } from '@/components/auth/permission-denied'
import { getAuthSessionSummary } from '@/lib/auth/server'

export const metadata: Metadata = {
  title: 'Access restricted',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const summary = await getAuthSessionSummary()
  const q = await searchParams
  const fromPath = q.from?.trim() || null

  return (
    <PermissionDenied
      appRole={summary?.appRole}
      fromPath={fromPath}
      description="This section is not available for your current role. Use the navigation items you can see, or ask an operations administrator to adjust your access."
    />
  )
}
