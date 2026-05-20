'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, Headphones, Home, LayoutDashboard, Shield } from 'lucide-react'

import { isDashboardPath } from '@/lib/nav/site-nav'
import { cn } from '@/lib/utils/cn'

const items = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { href: '/fleet', label: 'Fleet', icon: Car, match: (p: string) => p.startsWith('/fleet') },
  { href: '/support', label: 'Support', icon: Headphones, match: (p: string) => p.startsWith('/support') },
  {
    href: '/dashboard',
    label: 'Account',
    icon: LayoutDashboard,
    match: (p: string) => isDashboardPath(p),
  },
] as const

/** Mobile site + account nav for authenticated dashboard routes. */
export function DashboardMobileBottomNav({ adminConsoleHref }: { adminConsoleHref?: string }) {
  const pathname = usePathname()
  const mobileItems = adminConsoleHref
    ? [
        ...items,
        {
          href: adminConsoleHref,
          label: 'Admin',
          icon: Shield,
          match: (p: string) => p === adminConsoleHref || p.startsWith(`${adminConsoleHref}/`),
        },
      ]
    : items

  return (
    <nav
      aria-label="Mobile site and account"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-stroke bg-matte pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {mobileItems.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-[3.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors',
                active ? 'text-soft' : 'text-muted',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
