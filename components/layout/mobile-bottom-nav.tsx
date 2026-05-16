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
    label: 'WhatsApp',
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
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-stroke bg-matte/[0.92] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md supports-[backdrop-filter]:bg-matte/78 md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {items.map(({ href, label, icon: Icon, match, ...rest }) => {
          const active = match(pathname)
          const external = 'external' in rest && rest.external
          const className = cn(
            'touch-manipulation relative flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[11px] font-semibold tracking-[-0.01em] transition-[color,transform,background-color] duration-200 active:scale-[0.97]',
            active
              ? 'text-soft after:absolute after:bottom-1.5 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-soft/90'
              : 'text-muted active:bg-fill-glass',
          )
          const content = (
            <>
              <Icon
                className={cn(
                  'h-6 w-6 shrink-0 opacity-90 sm:h-[1.375rem] sm:w-[1.375rem]',
                )}
                aria-hidden
              />
              <span className="max-w-full truncate">{label}</span>
            </>
          )
          return external ? (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
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
