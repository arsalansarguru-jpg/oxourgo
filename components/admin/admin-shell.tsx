'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Banknote,
  Bell,
  CarFront,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from 'lucide-react'

import type { AppAuthRole } from '@/lib/auth/roles'
import type { OpsAlertListItem } from '@/lib/admin/data/ops-alerts'
import { AdminOpsAlertBell } from '@/components/admin/admin-ops-alert-bell'
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

export function AdminShell({ email, appRole, opsInitialUnread, opsInitialItems, children }: AdminShellProps) {
  const pathname = usePathname()

  return (
    <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-col gap-8 px-[var(--spacing-edge)] pb-16 pt-8 md:pt-10 lg:flex-row lg:gap-10">
      <aside
        className={cn(
          'shrink-0 lg:w-64',
          cardSurfaceBase,
          cardSurfaceTransition,
          cardPaddingCompact,
          'rounded-2xl border border-white/[0.08] bg-carbon/[0.55] p-4 backdrop-blur-xl lg:rounded-3xl lg:p-5',
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric/90">Operations</p>
            <p className="mt-2 text-sm font-semibold tracking-[-0.02em] text-soft">Oxour Go Admin</p>
            <p className="mt-1 truncate text-xs text-muted">{email ?? '—'}</p>
            <p className="mt-2 inline-flex rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
              {appRole.replace('_', ' ')}
            </p>
          </div>
          <AdminOpsAlertBell initialUnread={opsInitialUnread} initialItems={opsInitialItems} />
        </div>
        <nav className="mt-5 flex flex-col gap-1" aria-label="Admin">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium tracking-[-0.01em] transition-[color,background-color,box-shadow] duration-200',
                  active
                    ? 'bg-white/[0.1] text-soft shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]'
                    : 'text-muted hover:bg-white/[0.05] hover:text-soft',
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-electric/90" aria-hidden />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-6 border-t border-white/[0.06] pt-4">
          <Link href="/dashboard" className="text-xs text-muted transition-colors hover:text-soft">
            ← Customer dashboard
          </Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
