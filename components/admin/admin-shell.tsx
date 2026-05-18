'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  Home,
  LayoutGrid,
  Menu,
  UserRound,
  X,
} from 'lucide-react'

import { RoleBadge } from '@/components/auth/role-badge'
import type { Permission } from '@/lib/auth/permissions'
import { hasPermission } from '@/lib/auth/permissions'
import type { AppAuthRole } from '@/lib/auth/roles'
import type { OpsAlertListItem } from '@/lib/admin/data/ops-alerts'
import {
  ADMIN_NAV,
  adminTopBarTitle,
  readAdminSidebarCollapsed,
  writeAdminSidebarCollapsed,
} from '@/components/admin/admin-nav-config'
import { AdminOpsAlertBell } from '@/components/admin/admin-ops-alert-bell'
import { BrandLogo } from '@/components/layout/brand-logo'
import { cn } from '@/lib/utils/cn'

export type AdminShellProps = {
  email: string | undefined
  appRole: AppAuthRole
  permissions: Permission[]
  opsInitialUnread: number
  opsInitialItems: OpsAlertListItem[]
  children: React.ReactNode
}

function NavLinks({
  pathname,
  collapsed,
  permissions,
  onNavigate,
}: {
  pathname: string
  collapsed?: boolean
  permissions: Permission[]
  onNavigate?: () => void
}) {
  const permissionSet = new Set(permissions)
  const items = ADMIN_NAV.filter((item) => permissionSet.has(item.permission))

  return (
    <>
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            onClick={onNavigate}
            className={cn(
              'flex min-h-11 items-center rounded-xl text-sm font-medium transition-colors',
              collapsed ? 'justify-center px-0 py-3' : 'gap-2.5 px-2.5 py-2.5',
              active ? 'bg-electric/15 text-soft ring-1 ring-electric/20' : 'text-muted hover:bg-fill-glass hover:text-soft',
            )}
          >
            <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} aria-hidden />
            <span className={cn('min-w-0 truncate', collapsed && 'sr-only')}>{label}</span>
          </Link>
        )
      })}
    </>
  )
}

function BrandBlock({ expanded }: { expanded: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', !expanded && 'justify-center')}>
      <BrandLogo
        variant={expanded ? 'lockup' : 'mark'}
        className={cn('shrink-0', expanded ? 'h-8 w-auto max-w-[6rem]' : 'h-8 w-8')}
      />
      {expanded ? <span className="text-sm font-medium text-soft">Admin</span> : null}
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
    <div className="border-t border-stroke pt-4">
      {expanded ? (
        <>
          <p className="truncate text-xs text-muted">{email ?? '—'}</p>
          <div className="mt-2">
            <RoleBadge role={appRole} />
          </div>
        </>
      ) : (
        <div className="flex justify-center" title={email ?? 'Account'}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-stroke bg-carbon-deep text-muted">
            <UserRound className="h-4 w-4" aria-hidden />
          </div>
        </div>
      )}
      <div className={cn('mt-3 flex flex-col gap-0.5', !expanded && 'items-center')}>
        {hasPermission(appRole, 'ops.alerts.read') ? (
          <Link
            href="/admin/notifications"
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-muted hover:bg-fill-glass hover:text-soft',
              !expanded && 'justify-center p-2',
            )}
            title="Alerts"
          >
            <Bell className="h-4 w-4 shrink-0" aria-hidden />
            {expanded ? <span>Alerts</span> : null}
          </Link>
        ) : null}
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-muted hover:bg-fill-glass hover:text-soft',
            !expanded && 'justify-center p-2',
          )}
          title="Marketing home"
        >
          <Home className="h-4 w-4 shrink-0" aria-hidden />
          {expanded ? <span>Home</span> : null}
        </Link>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-muted hover:bg-fill-glass hover:text-soft',
            !expanded && 'justify-center p-2',
          )}
          title="Customer app"
        >
          <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
          {expanded ? <span>Customer app</span> : null}
        </Link>
      </div>
    </div>
  )
}

export function AdminShell({
  email,
  appRole,
  permissions,
  opsInitialUnread,
  opsInitialItems,
  children,
}: AdminShellProps) {
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
    <div className="flex min-h-dvh min-w-0 bg-[#080706] text-soft [--color-carbon-deep:#17120d] [--color-carbon:#100d09] [--color-fill-glass-strong:rgb(201_154_85/0.16)] [--color-fill-glass:rgb(255_255_255/0.055)] [--color-matte:#080706] [--color-muted:#a99b88] [--color-soft:#f8f2e8] [--color-stroke-strong:rgb(255_255_255/0.16)] [--color-stroke:rgb(255_255_255/0.09)]">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/[0.08] bg-[#0d0a07]/92 py-5 shadow-[18px_0_80px_-60px_rgba(0,0,0,0.95)] backdrop-blur-xl lg:flex',
          'transition-[width,padding] duration-200',
          desktopExpanded ? 'w-60 px-4' : 'w-[4.25rem] px-2',
        )}
        aria-label="Admin navigation"
      >
        <BrandBlock expanded={desktopExpanded} />
        <nav
          className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto"
          aria-label="Admin sections"
        >
          <NavLinks pathname={pathname} collapsed={!desktopExpanded} permissions={permissions} />
        </nav>
        <SidebarFooter collapsed={!desktopExpanded} email={email} appRole={appRole} />
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            'mt-3 flex items-center justify-center gap-2 rounded-xl border border-stroke py-2 text-xs font-medium text-muted hover:bg-fill-glass hover:text-soft',
            desktopExpanded ? 'w-full px-3' : 'h-9 w-full',
          )}
          aria-expanded={desktopExpanded}
          aria-label={desktopExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {desktopExpanded ? (
            <>
              <ChevronsLeft className="h-4 w-4" aria-hidden />
              <span>Collapse</span>
            </>
          ) : (
            <ChevronsRight className="h-4 w-4" aria-hidden />
          )}
        </button>
      </aside>

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[padding] duration-200',
          desktopExpanded ? 'lg:pl-60' : 'lg:pl-[4.25rem]',
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] bg-[#0d0a07]/88 px-4 shadow-[0_18px_60px_-50px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-stroke text-soft lg:hidden"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="truncate font-display text-base font-semibold text-soft">{barTitle}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {hasPermission(appRole, 'ops.alerts.read') ? (
              <AdminOpsAlertBell initialUnread={opsInitialUnread} initialItems={opsInitialItems} />
            ) : null}
          </div>
        </header>

        {mobileOpen ? (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-soft/20 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <aside
              className="fixed inset-y-0 left-0 z-50 flex w-[min(17rem,88vw)] flex-col border-r border-white/[0.08] bg-[#0d0a07] p-4 lg:hidden"
              aria-label="Admin navigation mobile"
            >
              <div className="flex items-center justify-between gap-3">
                <BrandBlock expanded />
                <button
                  type="button"
                  className="inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl text-muted hover:bg-fill-glass hover:text-soft"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto" aria-label="Admin sections mobile">
                <NavLinks pathname={pathname} permissions={permissions} onNavigate={() => setMobileOpen(false)} />
              </nav>
              <SidebarFooter
                collapsed={false}
                email={email}
                appRole={appRole}
                onNavigate={() => setMobileOpen(false)}
              />
            </aside>
          </>
        ) : null}

        <main className="flex-1 overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(201,154,85,0.14),transparent_28rem),linear-gradient(180deg,#080706,#0c0906)]">
          <div className="mx-auto w-full max-w-[80rem] px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
            <div className="flex min-w-0 flex-col gap-6 sm:gap-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
