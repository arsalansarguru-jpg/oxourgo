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
    if (typeof document === 'undefined') return
    const onDoc = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('touchstart', onDoc)
    }
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
          'relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-soft shadow-[var(--shadow-card)] transition-[background-color,box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-white/[0.07]',
          open && 'border-amber-400/35 bg-amber-500/12 shadow-[0_0_28px_-10px_rgba(251,191,36,0.35)]',
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
              'absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0f]/95 p-0 shadow-[0_28px_90px_-36px_rgba(0,0,0,0.92)] ring-1 ring-inset ring-white/[0.04] backdrop-blur-2xl',
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
                  {items.map((n) => {
                    const ageInMs = new Date().getTime() - new Date(n.created_at).getTime()
                    const ageInDays = ageInMs / (1000 * 60 * 60 * 24)
                    const isSlaBreach = ageInDays >= 3

                    return (
                      <li key={n.id} className="border-b border-stroke last:border-0">
                        <div className="flex gap-2 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-sm font-medium text-soft">{n.title}</p>
                              {isSlaBreach ? (
                                <span className="inline-flex items-center gap-0.5 rounded bg-rose-500/10 px-1 py-0.2 text-[9px] font-semibold text-rose-400 border border-rose-500/20 animate-pulse shrink-0">
                                  ⚠️ SLA Breach
                                </span>
                              ) : null}
                            </div>
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
                    )
                  })}
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
