import type { ReactNode } from 'react'

import { MainLayout } from '@/components/layout/main-layout'

/**
 * Authenticated + marketing shell: nav, page transition, footer, mobile nav.
 * Add a parallel `(auth)` route group later if you need a minimal layout.
 */
export default function AppShellLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>
}
