'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Banknote,
  Bell,
  CarFront,
  ClipboardList,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'

import type { AppAuthRole } from '@/lib/auth/roles'
import type { OpsAlertListItem } from '@/lib/admin/data/ops-alerts'
import { AdminOpsAlertBell } from '@/components/admin/admin-ops-alert-bell'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { cn } from '@/lib/utils/cn'
import { cardPaddingCompact, cardSurfaceBase, cardSurfaceTransition } from '@/components/ui/card-tokens'

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/fleet', label: 'Fleet', icon: CarFront, exact: false },
  { href: '/admin/bookings', label: 'Bookings', icon: ClipboardList, exact: false },
  { href: '/admin/customers', label: 'Customers', icon: Users, exact: false },
  { href: '/admin/kyc', label: 'KYC', icon: ShieldCheck, exact: false },
  { href: '/admin/payments', label: 'Payments', icon: Banknote, exact: false },
  { href: '/admin/notifications', label: 'Alerts', icon: Bell, exact: false },
] as const

export type AdminShellProps = {
  email: string | undefined
  appRole: AppAuthRole
  opsInitialUnread: number
  opsInitialItems: OpsAlertListItem[]
  children: React.ReactNode
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <>
      {nav.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium tracking-[-0.01em] transition-[color,background-color,box-shadow] duration-200',
              active
                ? 'bg-fill-glass-strong text-soft shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]'
                : 'text-muted hover:bg-fill-glass hover:text-soft',
            )}
          >
            <Icon className="h-4 w-4 shrink-0 text-electric/90" aria-hidden />
            {label}
          </Link>
        )
      })}
    </>
  )
}

export function AdminShell({ email, appRole, opsInitialUnread, opsInitialItems, children }: AdminShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  return (
    <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-6 px-[var(--spacing-edge)] pb-20 pt-6 md:gap-8 md:pt-8 lg:flex-row lg:gap-10 lg:pt-10">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/90">Oxour Go</p>
          <p className="truncate text-sm font-semibold text-soft">Admin</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <AdminOpsAlertBell initialUnread={opsInitialUnread} initialItems={opsInitialItems} />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stroke bg-carbon/60 text-soft backdrop-blur-md"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.aside
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-[min(20rem,88vw)] overflow-y-auto border-r border-stroke bg-carbon-deep p-4 shadow-2xl lg:hidden',
              cardSurfaceTransition,
            )}
          >
            <div className="flex items-start justify-between gap-2 border-b border-stroke pb-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Operations</p>
                <p className="mt-1 truncate text-xs text-muted">{email ?? '—'}</p>
                <p className="mt-2 inline-flex rounded-full border border-stroke bg-fill-glass px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                  {appRole.replace('_', ' ')}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-muted hover:bg-fill-glass-strong hover:text-soft"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-4 flex flex-col gap-1" aria-label="Admin mobile">
              <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className="mt-6 border-t border-stroke pt-4">
              <Link href="/dashboard" className="text-xs text-muted hover:text-soft" onClick={() => setMobileOpen(false)}>
                ← Customer dashboard
              </Link>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 lg:flex lg:w-64 lg:flex-col',
          cardSurfaceBase,
          cardSurfaceTransition,
          cardPaddingCompact,
          'rounded-2xl border border-stroke bg-carbon/[0.55] p-4 backdrop-blur-xl lg:rounded-3xl lg:p-5',
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-stroke pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Operations</p>
            <p className="mt-2 text-sm font-semibold tracking-[-0.02em] text-soft">Oxour Go Admin</p>
            <p className="mt-1 truncate text-xs text-muted">{email ?? '—'}</p>
            <p className="mt-2 inline-flex rounded-full border border-stroke bg-fill-glass px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
              {appRole.replace('_', ' ')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <AdminOpsAlertBell initialUnread={opsInitialUnread} initialItems={opsInitialItems} />
          </div>
        </div>
        <nav className="mt-5 flex flex-col gap-1" aria-label="Admin">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="mt-6 border-t border-stroke pt-4">
          <Link href="/dashboard" className="text-xs text-muted transition-colors hover:text-soft">
            ← Customer dashboard
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
