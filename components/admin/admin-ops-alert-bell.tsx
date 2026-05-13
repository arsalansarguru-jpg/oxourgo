'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { BellRing } from 'lucide-react'

import { dismissOpsAlertAction, getOpsAlertsSnippetAction } from '@/lib/admin/actions/ops-alert-actions'
import type { OpsAlertListItem } from '@/lib/admin/data/ops-alerts'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

export function AdminOpsAlertBell({
  initialUnread,
  initialItems,
}: {
  initialUnread: number
  initialItems: OpsAlertListItem[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(initialUnread)
  const [items, setItems] = useState(initialItems)
  const [dismissPending, startDismiss] = useTransition()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUnread(initialUnread)
    setItems(initialItems)
  }, [initialItems, initialUnread])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const next = await getOpsAlertsSnippetAction()
          setUnread(next.unread)
          setItems(next.items)
        } catch {
          /* ignore */
        }
      })()
    }, 45000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-xl border border-stroke bg-fill-glass text-soft transition-[background-color,box-shadow,border-color] duration-200 hover:border-stroke-strong hover:bg-fill-glass-strong',
          open && 'border-amber-400/35 bg-amber-500/10',
        )}
        aria-expanded={open}
        aria-label="Operations alerts"
      >
        <BellRing className="h-[1.125rem] w-[1.125rem]" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-none text-matte shadow-[0_0_12px_rgba(251,191,36,0.45)]">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              cardSurfaceBase,
              'absolute left-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-stroke bg-carbon/[0.92] p-0 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur-2xl lg:left-auto lg:right-0',
            )}
          >
            <div className="border-b border-stroke px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Operations</p>
            </div>
            <div className="max-h-[min(70vh,22rem)] overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted">No active alerts.</p>
              ) : (
                <ul>
                  {items.map((n) => (
                    <li key={n.id} className="border-b border-stroke last:border-0">
                      <div className="flex gap-2 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-soft">{n.title}</p>
                          {n.body ? <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p> : null}
                        </div>
                        <button
                          type="button"
                          className="shrink-0 text-[11px] font-semibold text-electric hover:underline"
                            disabled={dismissPending}
                            onClick={() => {
                              startDismiss(async () => {
                              await dismissOpsAlertAction(n.id)
                              setItems((prev) => prev.filter((x) => x.id !== n.id))
                              setUnread((c) => Math.max(0, c - 1))
                              router.refresh()
                            })
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-stroke p-2">
              <Button variant="ghost" size="sm" className="w-full" to="/admin/notifications" onClick={() => setOpen(false)}>
                Alert center
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
