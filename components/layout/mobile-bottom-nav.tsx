'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, Headphones, Home, MessageCircle } from 'lucide-react'
import { BRAND } from '@/constants/brand'
import { cn } from '@/lib/utils/cn'

const items = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { href: '/fleet', label: 'Fleet', icon: Car, match: (p: string) => p.startsWith('/fleet') },
  { href: '/support', label: 'Support', icon: Headphones, match: (p: string) => p.startsWith('/support') },
  {
    href: BRAND.whatsapp,
    label: 'Chat',
    icon: MessageCircle,
    external: true,
    match: () => false,
  },
] as const

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Mobile primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-stroke bg-matte pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {items.map(({ href, label, icon: Icon, match, ...rest }) => {
          const active = match(pathname)
          const external = 'external' in rest && rest.external
          const className = cn(
            'flex min-h-[3.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium',
            active ? 'text-soft' : 'text-muted',
          )
          const content = (
            <>
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </>
          )
          return external ? (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" className={className}>
              {content}
            </a>
          ) : (
            <Link key={href} href={href} className={className}>
              {content}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
