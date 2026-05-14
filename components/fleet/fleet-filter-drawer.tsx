'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

const ease = [0.22, 1, 0.36, 1] as const

type FleetFilterDrawerProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

/** Mobile-only bottom sheet for fleet filters (luxury touch targets, safe areas). */
export function FleetFilterDrawer({
  open,
  onClose,
  title = 'Refine collection',
  children,
  footer,
  className,
}: FleetFilterDrawerProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close filters"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="fixed inset-0 z-[90] bg-matte/60 backdrop-blur-md md:hidden"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fleet-filter-drawer-title"
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            exit={{ y: '105%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-[95] max-h-[88dvh] scroll-touch overflow-y-auto overscroll-y-contain rounded-t-[1.35rem] border border-stroke bg-matte/[0.97] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur-2xl md:hidden',
              className,
            )}
          >
            <div className="mx-auto mb-3 h-1 w-11 shrink-0 rounded-full bg-silver/35" aria-hidden />
            <div className="flex items-center justify-between gap-3 border-b border-stroke pb-4">
              <h2 id="fleet-filter-drawer-title" className="text-lg font-semibold tracking-[-0.02em] text-soft">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="touch-manipulation inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stroke bg-fill-glass text-soft transition hover:border-stroke-strong hover:bg-fill-glass-strong"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="py-5">{children}</div>
            {footer ? <div className="border-t border-stroke pt-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
