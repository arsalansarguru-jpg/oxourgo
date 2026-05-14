import type { ReactNode } from 'react'

import { DashboardSlimFooter } from '@/components/layout/dashboard-slim-footer'
import { DashboardTopBar, type DashboardTopBarProps } from '@/components/layout/dashboard-top-bar'
import { FloatingWhatsApp } from '@/components/layout/floating-whatsapp'

type Props = {
  children: ReactNode
} & DashboardTopBarProps

/**
 * Authenticated customer dashboard shell: compact topbar, slim footer, no marketing chrome.
 * WhatsApp concierge FAB bottom-left (marketing mobile nav is not used here).
 */
export function DashboardLayout({ children, ...topBar }: Props) {
  return (
    <div className="min-h-dvh bg-matte pb-8 md:pb-10">
      <DashboardTopBar {...topBar} />
      <main id="main" className="pb-6 pt-0 md:pb-8">
        {children}
      </main>
      <DashboardSlimFooter />
      <FloatingWhatsApp position="left" />
    </div>
  )
}
