'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  Menu,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'

import type { AppAuthRole } from '@/lib/auth/roles'
import type { OpsAlertListItem } from '@/lib/admin/data/ops-alerts'
import {
  ADMIN_NAV,
  adminTopBarTitle,
  readAdminSidebarCollapsed,
  writeAdminSidebarCollapsed,
} from '@/components/admin/admin-nav-config'
import { AdminOpsAlertBell } from '@/components/admin/admin-ops-alert-bell'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { cn } from '@/lib/utils/cn'

export type AdminShellProps = {
  email: string | undefined
  appRole: AppAuthRole
  opsInitialUnread: number
  opsInitialItems: OpsAlertListItem[]
  children: React.ReactNode
}

const SIDEBAR_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

function NavLinks({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string
  collapsed?: boolean
  onNavigate?: () => void
}) {
  return (
    <>
      {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            onClick={onNavigate}
            className={cn(
              'group relative flex items-center rounded-2xl text-[13px] font-medium tracking-[-0.015em] transition-[color,background-color,box-shadow,transform,padding] duration-300',
              SIDEBAR_EASE,
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3.5 py-2.5',
              active
                ? 'bg-white/[0.1] text-soft shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_0_0_1px_rgba(59,130,246,0.28),0_10px_36px_-20px_rgba(59,130,246,0.4)]'
                : 'text-muted hover:bg-white/[0.055] hover:text-soft hover:shadow-[0_6px_24px_-18px_rgba(0,0,0,0.55)]',
              !active && 'hover:-translate-y-px',
            )}
          >
            {active ? (
              <span
                className={cn(
                  'absolute rounded-full bg-electric shadow-[0_0_14px_rgba(59,130,246,0.65)]',
                  collapsed ? 'left-1/2 top-0 h-0.5 w-6 -translate-x-1/2' : 'left-0 top-1/2 h-7 w-0.5 -translate-y-1/2',
                )}
                aria-hidden
              />
            ) : null}
            <Icon
              className={cn(
                'relative shrink-0 transition-[color,transform] duration-300',
                collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]',
                active ? 'text-electric' : 'text-silver group-hover:scale-[1.04] group-hover:text-soft',
              )}
              aria-hidden
            />
            <span
              className={cn(
                'relative min-w-0 overflow-hidden transition-[opacity] duration-300',
                collapsed ? 'sr-only' : 'opacity-100',
              )}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </>
  )
}

function BrandBlock({ expanded }: { expanded: boolean }) {
  return (
    <div className={cn('flex items-center gap-3', !expanded && 'flex-col justify-center gap-2.5')}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-electric/28 via-white/[0.06] to-transparent shadow-[0_0_32px_-10px_rgba(59,130,246,0.5)] ring-1 ring-inset ring-white/[0.06]">
        <Sparkles className="h-[19px] w-[19px] text-electric" aria-hidden />
      </div>
      {expanded ? (
        <div className="min-w-0 pt-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-electric/90">Oxour Go</p>
          <p className="mt-1 text-[15px] font-semibold tracking-[-0.035em] text-soft">Admin</p>
          <p className="mt-0.5 text-[11px] font-medium tracking-wide text-muted/90">Luxury mobility</p>
        </div>
      ) : null}
    </div>
  )
}

function SidebarFooter({
  collapsed,
  email,
  appRole,
  onNavigate,
}: {
  collapsed: boolean
  email: string | undefined
  appRole: AppAuthRole
  onNavigate?: () => void
}) {
  const expanded = !collapsed
  return (
    <div className="border-t border-white/[0.06] pt-5">
      {expanded ? (
        <>
          <p className="truncate text-[11px] font-medium leading-snug text-soft">{email ?? '—'}</p>
          <p className="mt-2 inline-flex max-w-full rounded-full border border-white/[0.08] bg-white/[0.045] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            <span className="truncate">{appRole.replace('_', ' ')}</span>
          </p>
        </>
      ) : (
        <div className="flex justify-center" title={email ?? 'Account'}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-muted shadow-[var(--shadow-card)]">
            <UserRound className="h-[18px] w-[18px]" aria-hidden />
          </div>
        </div>
      )}
      <div className={cn('mt-4 flex flex-col gap-1.5', !expanded && 'items-center')}>
        <Link
          href="/admin/notifications"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 rounded-xl text-[12px] font-medium text-muted transition-[color,background-color] duration-200 hover:bg-white/[0.05] hover:text-soft',
            expanded ? 'px-2 py-2' : 'justify-center p-2',
          )}
          title="Alerts"
        >
          <Bell className="h-4 w-4 shrink-0 text-silver" aria-hidden />
          {expanded ? <span>Alerts</span> : null}
        </Link>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 rounded-xl text-[12px] font-medium text-muted transition-[color,background-color] duration-200 hover:bg-white/[0.05] hover:text-soft',
            expanded ? 'px-2 py-2' : 'justify-center p-2',
          )}
          title="Customer app"
        >
          <LayoutGrid className="h-4 w-4 shrink-0 text-silver" aria-hidden />
          {expanded ? <span>Customer app</span> : null}
        </Link>
      </div>
    </div>
  )
}

export function AdminShell({ email, appRole, opsInitialUnread, opsInitialItems, children }: AdminShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarHydrated, setSidebarHydrated] = useState(false)

  const barTitle = adminTopBarTitle(pathname)

  useEffect(() => {
    setCollapsed(readAdminSidebarCollapsed())
    setSidebarHydrated(true)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      writeAdminSidebarCollapsed(next)
      return next
    })
  }

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

  const desktopExpanded = sidebarHydrated ? !collapsed : true

  return (
    <div className="flex min-h-dvh min-w-0">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/[0.08] py-8 shadow-[12px_0_64px_-36px_rgba(0,0,0,0.92)] backdrop-blur-2xl backdrop-saturate-150 lg:flex',
          'bg-gradient-to-b from-white/[0.07] via-[#070708]/96 to-[#040405]/98 ring-1 ring-inset ring-white/[0.04]',
          'transition-[width,padding] duration-300 ease-out',
          desktopExpanded ? 'w-[17.5rem] pl-6 pr-5' : 'w-[4.75rem] px-2.5',
        )}
        aria-label="Admin navigation"
      >
        <BrandBlock expanded={desktopExpanded} />

        <p
          className={cn(
            'text-[10px] font-semibold uppercase tracking-[0.22em] text-muted transition-opacity duration-300',
            desktopExpanded ? 'mt-9 opacity-100' : 'sr-only',
          )}
        >
          Navigate
        </p>
        <nav
          className={cn(
            'mt-3 flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden pr-0.5',
            !desktopExpanded && 'items-stretch',
          )}
          aria-label="Admin sections"
        >
          <NavLinks pathname={pathname} collapsed={!desktopExpanded} />
        </nav>

        <SidebarFooter collapsed={!desktopExpanded} email={email} appRole={appRole} />

        <div className={cn('mt-4 border-t border-white/[0.06] pt-4', !desktopExpanded && 'flex justify-center')}>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-[12px] font-semibold text-muted shadow-[var(--shadow-card)] transition-[color,background-color,border-color,transform,box-shadow] duration-300 hover:border-white/[0.12] hover:bg-white/[0.07] hover:text-soft hover:shadow-[var(--shadow-card-hover)] active:scale-[0.98]',
              desktopExpanded ? 'w-full px-3' : 'h-10 w-10 px-0',
            )}
            aria-expanded={desktopExpanded}
            aria-label={desktopExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {desktopExpanded ? (
              <>
                <ChevronsLeft className="h-4 w-4 shrink-0" aria-hidden />
                <span>Collapse</span>
              </>
            ) : (
              <ChevronsRight className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </aside>

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out',
          desktopExpanded ? 'lg:pl-[17.5rem]' : 'lg:pl-[4.75rem]',
        )}
      >
        <header className="sticky top-0 z-30 flex h-[4.25rem] shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-[#060608]/82 px-4 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-soft transition-[background-color,border-color,box-shadow,transform] duration-300 hover:border-white/[0.12] hover:bg-white/[0.07] hover:shadow-[var(--shadow-card)] active:scale-[0.98] lg:hidden"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Operations</p>
              <h1 className="truncate text-lg font-semibold tracking-[-0.03em] text-soft sm:text-xl">{barTitle}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <AdminOpsAlertBell initialUnread={opsInitialUnread} initialItems={opsInitialItems} />
          </div>
        </header>

        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-40 bg-black/78 backdrop-blur-md lg:hidden"
              aria-hidden
              onClick={() => setMobileOpen(false)}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {mobileOpen ? (
            <motion.aside
              key="drawer"
              initial={{ x: '-105%' }}
              animate={{ x: 0 }}
              exit={{ x: '-105%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[min(21rem,92vw)] min-w-0 flex-col border-r border-white/[0.09] bg-gradient-to-b from-white/[0.08] via-[#08080c]/98 to-[#050506] px-5 pb-[max(1.25rem,var(--safe-bottom))] pt-[max(1rem,var(--safe-top))] shadow-[24px_0_80px_-40px_rgba(0,0,0,0.9)] ring-1 ring-inset ring-white/[0.05] backdrop-blur-2xl backdrop-saturate-150 lg:hidden"
              aria-label="Admin navigation mobile"
            >
              <div className="flex items-start justify-between gap-3">
                <BrandBlock expanded />
                <button
                  type="button"
                  className="rounded-xl p-2 text-muted transition-colors duration-200 hover:bg-white/[0.07] hover:text-soft"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Navigate</p>
              <nav className="mt-3 flex flex-1 flex-col gap-0.5 overflow-y-auto" aria-label="Admin sections mobile">
                <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              </nav>
              <SidebarFooter
                collapsed={false}
                email={email}
                appRole={appRole}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.aside>
          ) : null}
        </AnimatePresence>

        <div className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-[min(100rem,calc(100vw-1.5rem))] px-4 py-8 sm:px-6 lg:px-8 lg:py-10 xl:px-10">
            <div className="grid auto-rows-min gap-8 lg:gap-10">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
