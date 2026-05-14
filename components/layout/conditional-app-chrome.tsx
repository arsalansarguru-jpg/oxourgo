'use client'

import { usePathname } from 'next/navigation'

import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { Navbar } from '@/components/layout/navbar'
import { PageTransition } from '@/components/layout/page-transition'

function isAdminPath(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export function ConditionalAppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const admin = isAdminPath(pathname)

  const skipClass =
    'sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-electric focus:px-4 focus:py-2.5 focus:text-white focus:shadow-[0_0_24px_-4px_rgba(59,130,246,0.55)]'

  if (admin) {
    return (
      <div className="admin-app-root min-h-dvh">
        <a href="#main" className={skipClass}>
          Skip to content
        </a>
        <main id="main" className="min-h-dvh">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-matte pb-[var(--bottom-nav-clearance)] md:pb-0">
      <a href="#main" className={skipClass}>
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
