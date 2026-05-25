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

  const ageInMs = new Date().getTime() - new Date(alert.created_at).getTime()
  const ageInDays = ageInMs / (1000 * 60 * 60 * 24)
  const isSlaBreach = ageInDays >= 3

  return (
    <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <AdminCard interactive>
        <AdminCardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-electric/90">{alert.type.replace(/_/g, ' ')}</p>
              {isSlaBreach ? (
                <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20 animate-pulse">
                  ⚠️ SLA Breach — 3+ Days Unreviewed
                </span>
              ) : null}
            </div>
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
