'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { motion } from 'framer-motion'

import { dismissOpsAlertAction } from '@/lib/admin/actions/ops-alert-actions'
import type { OpsAlertListItem } from '@/lib/admin/data/ops-alerts'
import { Button } from '@/components/ui/Button'
import { AdminCard, AdminCardContent } from '@/components/admin/admin-card'

export function AdminOpsAlertRow({ alert }: { alert: OpsAlertListItem }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  if (alert.dismissed) return null

  return (
    <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <AdminCard interactive>
        <AdminCardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-electric/90">{alert.type.replace(/_/g, ' ')}</p>
            <p className="font-semibold text-soft">{alert.title}</p>
            {alert.body ? <p className="text-sm text-muted">{alert.body}</p> : null}
            <p className="text-xs text-muted">{new Date(alert.created_at).toLocaleString()}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => {
              start(async () => {
                await dismissOpsAlertAction(alert.id)
                router.refresh()
              })
            }}
          >
            Dismiss
          </Button>
        </AdminCardContent>
      </AdminCard>
    </motion.li>
  )
}
