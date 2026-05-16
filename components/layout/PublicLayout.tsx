import type { ReactNode } from 'react'

import { FloatingWhatsApp } from '@/components/layout/floating-whatsapp'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { Navbar } from '@/components/layout/navbar'

/**
 * Marketing + catalog shell: full nav, footer, mobile nav, floating WhatsApp (bottom-right).
 */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-matte pb-[var(--bottom-nav-clearance)] md:pb-0">
      <Navbar />
      <main id="main" className="min-w-0 flex-1 pb-[var(--bottom-nav-clearance)] md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <FloatingWhatsApp position="right" />
    </div>
  )
}
