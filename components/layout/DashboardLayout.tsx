import type { ReactNode } from 'react'

import { DashboardMobileBottomNav } from '@/components/layout/dashboard-mobile-bottom-nav'
import { DashboardSlimFooter } from '@/components/layout/dashboard-slim-footer'
import { DashboardTopBar, type DashboardTopBarProps } from '@/components/layout/dashboard-top-bar'
import { FloatingWhatsApp } from '@/components/layout/floating-whatsapp'

type Props = {
  children: ReactNode
  /** Hide concierge FAB for staff (admin console is in-app). Defaults to true. */
  showConciergeFab?: boolean
} & DashboardTopBarProps

/**
 * Authenticated customer dashboard shell: compact topbar, slim footer, no marketing chrome.
 * WhatsApp concierge FAB bottom-left for customers (marketing mobile nav is not used here).
 */
export function DashboardLayout({ children, showConciergeFab = true, ...topBar }: Props) {
  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-matte pb-[var(--bottom-nav-clearance)] md:pb-10">
      <DashboardTopBar {...topBar} />
      <main id="main" className="min-w-0 flex-1 pb-6 pt-0 md:pb-8">
        {children}
      </main>
      <DashboardSlimFooter />
      <DashboardMobileBottomNav adminConsoleHref={topBar.adminConsoleHref} />
      {showConciergeFab ? <FloatingWhatsApp position="left" /> : null}
    </div>
  )
}
