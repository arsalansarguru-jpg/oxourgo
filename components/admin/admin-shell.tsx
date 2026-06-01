'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
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
              'flex min-h-11 items-center rounded-xl text-sm font-medium transition-all duration-200',
              collapsed ? 'justify-center px-0 py-3' : 'gap-2.5 px-2.5 py-2.5',
              active
                ? 'bg-electric/20 text-soft ring-1 ring-electric/35 shadow-[0_0_20px_rgba(0,102,255,0.25)]'
                : 'text-muted hover:bg-fill-glass hover:text-soft',
            )}
          >
            <Icon className={cn('shrink-0 text-electric', collapsed ? 'h-5 w-5' : 'h-4 w-4')} aria-hidden />
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                className="min-w-0 truncate"
              >
                {label}
              </motion.span>
            )}
          </Link>
        )
      })}
    </>
  )
}

function BrandBlock({ expanded }: { expanded: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 h-8', !expanded && 'justify-center')}>
      <BrandLogo
        variant={expanded ? 'lockup' : 'mark'}
        className={cn('shrink-0 h-8 w-auto', expanded ? 'max-w-[6rem]' : 'w-8')}
      />
      {expanded && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="text-sm font-semibold tracking-wider uppercase text-soft"
        >
          Admin
        </motion.span>
      )}
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
    <div className="border-t border-stroke pt-4 min-h-[110px]">
      {expanded ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <p className="truncate text-xs text-muted">{email ?? '—'}</p>
          <div className="mt-2">
            <RoleBadge role={appRole} />
          </div>
        </motion.div>
      ) : (
        <div className="flex justify-center" title={email ?? 'Account'}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-stroke bg-carbon-deep text-muted">
            <UserRound className="h-4 w-4" aria-hidden />
          </div>
        </div>
      )}
      <div className={cn('mt-3 flex flex-col gap-0.5', !expanded && 'items-center')}>
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-muted hover:bg-fill-glass hover:text-soft transition-colors',
            !expanded && 'justify-center p-2',
          )}
          title="Marketing home"
        >
          <Home className="h-4 w-4 shrink-0 text-electric" aria-hidden />
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="truncate"
            >
              Home
            </motion.span>
          )}
        </Link>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-muted hover:bg-fill-glass hover:text-soft transition-colors',
            !expanded && 'justify-center p-2',
          )}
          title="Customer app"
        >
          <LayoutGrid className="h-4 w-4 shrink-0 text-electric" aria-hidden />
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="truncate"
            >
              Customer app
            </motion.span>
          )}
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
  const [isHovered, setIsHovered] = useState(false)

  const barTitle = adminTopBarTitle(pathname)

  useEffect(() => {
    if (typeof window === 'undefined' || !barTitle) return
    const next = `${barTitle} | Oxour Go Admin`
    if (document.title !== next) {
      document.title = next
    }
  }, [barTitle])

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
  const isVisualExpanded = desktopExpanded || isHovered

  return (
    <div className="flex min-h-dvh min-w-0 bg-matte text-soft">
      <motion.aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          width: isVisualExpanded ? 240 : 68,
          paddingLeft: isVisualExpanded ? 16 : 8,
          paddingRight: isVisualExpanded ? 16 : 8,
        }}
        transition={{
          type: 'spring',
          stiffness: 280,
          damping: 24,
        }}
        className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-stroke bg-carbon-deep/95 py-5 shadow-[var(--shadow-sidebar)] backdrop-blur-2xl lg:flex overflow-hidden"
        aria-label="Admin navigation"
      >
        <BrandBlock expanded={isVisualExpanded} />
        <nav
          className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto scrollbar-none"
          aria-label="Admin sections"
        >
          <NavLinks pathname={pathname} collapsed={!isVisualExpanded} permissions={permissions} />
        </nav>
        <SidebarFooter collapsed={!isVisualExpanded} email={email} appRole={appRole} />
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            'mt-3 flex items-center justify-center gap-2 rounded-xl border border-stroke py-2 text-xs font-medium text-muted hover:bg-fill-glass hover:text-soft transition-all duration-200',
            isVisualExpanded ? 'w-full px-3' : 'h-9 w-full',
          )}
          aria-expanded={desktopExpanded}
          aria-label={desktopExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isVisualExpanded ? (
            <>
              <ChevronsLeft className="h-4 w-4 shrink-0 text-electric" aria-hidden />
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="truncate"
              >
                Collapse
              </motion.span>
            </>
          ) : (
            <ChevronsRight className="h-4 w-4 shrink-0 text-electric" aria-hidden />
          )}
        </button>
      </motion.aside>

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[padding] duration-200',
          desktopExpanded ? 'lg:pl-60' : 'lg:pl-[4.25rem]',
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-stroke bg-carbon/90 px-4 shadow-[var(--shadow-card)] backdrop-blur-2xl sm:gap-4 sm:px-6">
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
            <h1 className="type-nav truncate font-display font-semibold text-soft">{barTitle}</h1>
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
              className="fixed inset-y-0 left-0 z-50 flex w-[min(17rem,88vw)] flex-col border-r border-stroke bg-carbon-deep p-4 lg:hidden"
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

        <main className="flex-1 overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(0,102,255,0.16),transparent_28rem),linear-gradient(180deg,var(--color-matte),var(--color-carbon))]">
          <div className="mx-auto w-full max-w-[80rem] px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
            <div className="flex min-w-0 flex-col gap-6 sm:gap-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
