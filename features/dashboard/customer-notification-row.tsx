'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { motion } from 'framer-motion'

import { markNotificationReadAction } from '@/app/(main)/dashboard/notifications/actions'
import type { NotificationRow } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cardSurfaceHover, cardSurfaceTransition } from '@/components/ui/card-tokens'

function hrefFor(row: NotificationRow): string | null {
  const m = row.metadata as { booking_id?: string; kyc_document_id?: string } | null
  if (m?.booking_id && typeof m.booking_id === 'string') return `/dashboard/bookings/${m.booking_id}`
  if (row.type.startsWith('kyc')) return '/dashboard/kyc'
  if (row.type.startsWith('payment')) return '/dashboard/payments'
  return null
}

export function CustomerNotificationRow({ row }: { row: NotificationRow }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const href = hrefFor(row)
  const unread = !row.read_at

  return (
    <motion.li layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <Card
        className={cn(
          cardSurfaceTransition,
          cardSurfaceHover,
          'overflow-hidden border border-stroke',
          unread && 'border-electric/25 bg-electric/[0.04]',
        )}
      >
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-soft">{row.title}</p>
              {unread ? (
                <span className="h-2 w-2 shrink-0 rounded-full bg-electric shadow-[0_0_12px_rgba(59,130,246,0.55)]" />
              ) : null}
            </div>
            {row.body ? <p className="text-sm text-muted">{row.body}</p> : null}
            <p className="text-xs text-muted">{new Date(row.created_at).toLocaleString()}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {unread ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => {
                  start(async () => {
                    await markNotificationReadAction(row.id)
                    router.refresh()
                  })
                }}
              >
                Mark read
              </Button>
            ) : null}
            {href ? (
              <Button variant="ghost" size="sm" to={href}>
                Open
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.li>
  )
}
