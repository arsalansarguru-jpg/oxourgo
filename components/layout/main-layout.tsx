import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { Navbar } from '@/components/layout/navbar'
import { PageTransition } from '@/components/layout/page-transition'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-matte pb-[var(--bottom-nav-clearance)] md:pb-0">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-electric focus:px-3 focus:py-2 focus:text-white"
      >
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
