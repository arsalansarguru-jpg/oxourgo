'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  CreditCard,
  FileBadge,
  Home,
  LayoutGrid,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { cn } from '@/lib/utils/cn'
import { cardPaddingCompact, cardSurfaceBase, cardSurfaceTransition } from '@/components/ui/card-tokens'

const nav = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/dashboard/bookings', label: 'My bookings', icon: LayoutGrid },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/kyc', label: 'KYC center', icon: ShieldCheck },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Profile', icon: Settings },
] as const

export type CustomerDashboardShellProps = {
  displayName: string
  email: string | undefined
  verificationLabel: string
  /** From `profiles.kyc_status` for nav affordances. */
  kycLifecycleStatus?: string
  children: React.ReactNode
}

export function CustomerDashboardShell({
  displayName,
  email,
  verificationLabel,
  kycLifecycleStatus = 'not_started',
  children,
}: CustomerDashboardShellProps) {
  const pathname = usePathname()

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-[var(--container-wide)] flex-col gap-8 px-[var(--spacing-edge)] pb-20 pt-8 md:pt-10 lg:flex-row lg:gap-10">
      <aside
        className={cn(
          'shrink-0 lg:w-64',
          cardSurfaceBase,
          cardSurfaceTransition,
          cardPaddingCompact,
          'rounded-2xl border border-stroke bg-carbon/[0.55] p-4 backdrop-blur-xl lg:rounded-3xl lg:p-5',
        )}
      >
        <div className="flex items-center gap-3 border-b border-stroke pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stroke bg-electric/15">
            <Sparkles className="h-5 w-5 text-electric" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-soft">{displayName}</p>
            <p className="truncate text-xs text-muted">{email ?? '—'}</p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          <FileBadge className="h-3.5 w-3.5 text-electric/90" aria-hidden />
          {verificationLabel}
        </p>
        <nav className="mt-5 flex flex-col gap-1" aria-label="Customer dashboard">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex w-full min-h-12 items-center justify-between gap-2 rounded-xl px-3 py-3 text-sm font-medium tracking-[-0.01em] transition-[color,background-color,box-shadow] duration-200',
                  active
                    ? 'bg-fill-glass-strong text-soft shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]'
                    : 'text-muted hover:bg-fill-glass hover:text-soft',
                )}
              >
                <span className="inline-flex min-w-0 items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-electric/90" aria-hidden />
                  <span className="truncate">{label}</span>
                </span>
                {href === '/dashboard/kyc' && kycLifecycleStatus !== 'approved' ? (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
                      kycLifecycleStatus === 'rejected'
                        ? 'bg-red-500/15 text-red-200/95'
                        : kycLifecycleStatus === 'pending'
                          ? 'bg-electric/20 text-electric'
                          : 'bg-fill-glass-strong text-muted',
                    )}
                    aria-hidden
                  >
                    {kycLifecycleStatus === 'rejected' ? '!' : kycLifecycleStatus === 'pending' ? '…' : '•'}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
