'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { SITE_PRIMARY_NAV } from '@/lib/nav/site-nav'
import { cn } from '@/lib/utils/cn'

export function SitePrimaryNav({
  className,
  onNavigate,
  size = 'default',
}: {
  className?: string
  onNavigate?: () => void
  size?: 'default' | 'compact'
}) {
  const pathname = usePathname()

  return (
    <nav aria-label="Site" className={className}>
      <ul
        className={cn(
          'flex items-center',
          size === 'compact' ? 'flex-col items-stretch gap-0.5' : 'gap-0.5 sm:gap-1',
        )}
      >
        {SITE_PRIMARY_NAV.map(({ href, label, match }) => {
          const active = match(pathname)
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  'block rounded-md font-medium transition-colors',
                  size === 'compact'
                    ? 'px-2.5 py-2 text-sm'
                    : 'px-2.5 py-2 text-sm sm:px-3',
                  active ? 'bg-fill-glass-strong text-soft' : 'text-muted hover:bg-fill-glass hover:text-soft',
                )}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
