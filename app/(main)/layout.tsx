import type { ReactNode } from 'react'

import { PageTransition } from '@/components/layout/page-transition'

const skipClass =
  'sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-electric focus:px-4 focus:py-2.5 focus:text-white focus:shadow-[0_0_24px_-4px_rgba(59,130,246,0.55)]'

/**
 * Root shell for all `(main)` routes. Public vs dashboard chrome lives in nested layouts
 * `(public)/layout` and `dashboard/layout` — not pathname switches.
 */
export default function MainSegmentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <a href="#main" className={skipClass}>
        Skip to content
      </a>
      <PageTransition>{children}</PageTransition>
    </div>
  )
}
