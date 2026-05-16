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
} from 'lucide-react'

import { cn } from '@/lib/utils/cn'
import { cardPaddingCompact, cardSurfaceBase } from '@/components/ui/card-tokens'

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
      <aside className={cn('shrink-0 lg:w-56', cardSurfaceBase, cardPaddingCompact)}>
        <div className="border-b border-stroke pb-4">
          <p className="truncate text-sm font-semibold text-soft">{displayName}</p>
          <p className="truncate text-xs text-muted">{email ?? '—'}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <FileBadge className="h-3.5 w-3.5" aria-hidden />
            {verificationLabel}
          </p>
        </div>
        <nav className="mt-4 flex flex-col gap-0.5" aria-label="Customer dashboard">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex min-h-10 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-fill-glass-strong text-soft' : 'text-muted hover:bg-fill-glass hover:text-soft',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
                {href === '/dashboard/kyc' && kycLifecycleStatus !== 'approved' ? (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-electric" aria-hidden />
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
