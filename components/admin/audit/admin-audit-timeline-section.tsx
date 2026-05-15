import { History } from 'lucide-react'

import { AdminAuditTimeline } from '@/components/admin/audit/admin-audit-timeline'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'
import { buildAuditActorLookup } from '@/lib/admin/data/audit-actors'
import type { AuditLogRow } from '@/lib/admin/data/audit-logs'

type Props = {
  title?: string
  description?: string
  entries: AuditLogRow[]
  compact?: boolean
  showEntityLinks?: boolean
}

export async function AdminAuditTimelineSection({
  title = 'Activity history',
  description = 'Immutable audit trail for this record.',
  entries,
  compact = false,
  showEntityLinks = false,
}: Props) {
  const actorLookup = await buildAuditActorLookup(entries.map((e) => e.actorId))

  return (
    <AdminCard>
      <AdminCardContent className="space-y-4 p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted" />
          <div>
            <h2 className="text-lg font-semibold text-soft">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
          </div>
        </div>
        <AdminAuditTimeline
          entries={entries}
          actorLookup={actorLookup}
          compact={compact}
          showEntityLinks={showEntityLinks}
        />
      </AdminCardContent>
    </AdminCard>
  )
}
