import type { ReactNode } from 'react'

import { DashboardSlimFooter } from '@/components/layout/dashboard-slim-footer'
import { DashboardTopBar, type DashboardTopBarProps } from '@/components/layout/dashboard-top-bar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

type Props = {
  children: ReactNode
} & DashboardTopBarProps

/**
 * Authenticated customer dashboard shell — minimal chrome (G1, G3).
 */
export function DashboardLayout({ children, ...topBar }: Props) {
  return (
    <>
      <DashboardTopBar {...topBar} />
      <div className="pb-20 md:pb-24">{children}</div>
      <DashboardSlimFooter />
      <MobileBottomNav />
    </>
  )
}
