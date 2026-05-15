import { Suspense } from 'react'
import { ScrollText } from 'lucide-react'

import { AdminAuditFilters } from '@/components/admin/audit/admin-audit-filters'
import { AdminAuditTimeline } from '@/components/admin/audit/admin-audit-timeline'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { buildAuditActorLookup } from '@/lib/admin/data/audit-actors'
import { listAuditLogs, listDistinctAuditActions } from '@/lib/admin/data/audit-logs'
import { listStaffUsersForAdmin } from '@/lib/admin/data/staff-users'
import { requireAdminPageAccess } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

const ENTITY_TYPES = ['booking', 'payment', 'deposit', 'profile', 'kyc', 'vehicle', 'fleet', 'user', 'violation', 'alert', 'whatsapp']

type SearchParams = {
  action?: string
  actor?: string
  entityType?: string
  entityId?: string
  from?: string
  to?: string
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdminPageAccess('/admin/audit')
  const params = await searchParams

  const fromIso = params.from || undefined
  const toIso = params.to || undefined

  let entries: Awaited<ReturnType<typeof listAuditLogs>> = []
  let actions: string[] = []
  let staff: Awaited<ReturnType<typeof listStaffUsersForAdmin>> = []

  try {
    ;[entries, actions, staff] = await Promise.all([
      listAuditLogs({
        action: params.action,
        actorId: params.actor,
        entityType: params.entityType,
        entityId: params.entityId,
        from: fromIso,
        to: toIso,
        limit: 100,
      }),
      listDistinctAuditActions(),
      listStaffUsersForAdmin(80),
    ])
  } catch {
    entries = []
    actions = []
    staff = []
  }

  const actorLookup = await buildAuditActorLookup(entries.map((e) => e.actorId))

  const actors = staff.map((u) => ({ id: u.id, email: u.email }))

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Compliance"
        title="Activity & audit log"
        description="Immutable trail of bookings, payments, KYC, fleet, and admin actions across Oxour Go."
      />

      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />}>
        <AdminAuditFilters actions={actions} actors={actors} entityTypes={ENTITY_TYPES} />
      </Suspense>

      <AdminCard>
        <AdminCardContent className="space-y-4 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-muted" />
              <h2 className="text-lg font-semibold text-soft">Global activity feed</h2>
            </div>
            <span className="text-xs tabular-nums text-muted">{entries.length} events</span>
          </div>
          <AdminAuditTimeline entries={entries} actorLookup={actorLookup} />
        </AdminCardContent>
      </AdminCard>
    </div>
  )
}
