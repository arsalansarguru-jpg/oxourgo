import type { ReactNode } from 'react'

import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { Navbar } from '@/components/layout/navbar'

/**
 * Marketing + catalog shell: full nav, generous bottom padding for floating actions (G1, G2).
 */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-matte pb-[var(--bottom-nav-clearance)] md:pb-0">
      <Navbar />
      <main id="main" className="pb-20 md:pb-24">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
