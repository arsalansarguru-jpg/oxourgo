'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell } from 'lucide-react'

import { markNotificationReadAction } from '@/app/(main)/dashboard/notifications/actions'
import { useSupabase } from '@/hooks/use-supabase'
import type { NotificationRow } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

export function DashboardNotificationBell({
  userId,
  initialUnread,
  initialPreview,
}: {
  userId: string
  initialUnread: number
  initialPreview: NotificationRow[]
}) {
  const supabase = useSupabase()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(initialUnread)
  const [items, setItems] = useState(initialPreview)
  const [pending, start] = useTransition()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUnread(initialUnread)
    setItems(initialPreview)
  }, [initialPreview, initialUnread])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as NotificationRow
          setItems((prev) => [row, ...prev].slice(0, 8))
          setUnread((c) => c + 1)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as NotificationRow
          setItems((prev) => {
            const idx = prev.findIndex((x) => x.id === row.id)
            if (idx === -1) return [row, ...prev].slice(0, 8)
            const next = [...prev]
            next[idx] = row
            return next
          })
          if (row.read_at) setUnread((c) => Math.max(0, c - 1))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.05] text-soft transition-[background-color,box-shadow,border-color] duration-200 hover:border-white/[0.16] hover:bg-white/[0.08]',
          open && 'border-electric/35 bg-electric/[0.08]',
        )}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Notifications"
      >
        <Bell className="h-[1.125rem] w-[1.125rem]" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-electric px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_12px_rgba(59,130,246,0.45)]">
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
              'absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-white/[0.1] bg-carbon/[0.92] p-0 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur-2xl',
            )}
          >
            <div className="border-b border-white/[0.08] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Notifications</p>
            </div>
            <div className="max-h-[min(70vh,22rem)] overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted">No recent notifications.</p>
              ) : (
                <ul>
                  {items.map((n) => (
                    <li key={n.id} className="border-b border-white/[0.05] last:border-0">
                      <div className="flex gap-2 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-soft">{n.title}</p>
                          {n.body ? <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p> : null}
                        </div>
                        {!n.read_at ? (
                          <button
                            type="button"
                            className="shrink-0 text-[11px] font-semibold text-electric hover:underline"
                            disabled={pending}
                            onClick={() => {
                              start(async () => {
                                await markNotificationReadAction(n.id)
                                router.refresh()
                              })
                            }}
                          >
                            Read
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-white/[0.08] p-2">
              <Button variant="ghost" size="sm" className="w-full" to="/dashboard/notifications" onClick={() => setOpen(false)}>
                Notification center
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
