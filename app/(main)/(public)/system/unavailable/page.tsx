import type { Metadata } from 'next'

import { BrandLogo } from '@/components/layout/brand-logo'
import { Button } from '@/components/ui/Button'
import { buildPageMetadata } from '@/lib/seo/build-page-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Temporarily unavailable',
  description: 'Oxour Go member tools are temporarily unavailable. Please try again later.',
  path: '/system/unavailable',
  robots: { index: false, follow: false },
})

/**
 * Shown when protected areas cannot be secured (e.g. missing public Supabase configuration).
 * Copy is intentionally generic — no hostnames, keys, or stack traces.
 */
export default function SystemUnavailablePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <BrandLogo className="h-9 w-auto opacity-90" />
      <h1 className="mt-10 text-2xl font-semibold tracking-[-0.03em] text-soft">We will be right back</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Member sign-in and account tools are temporarily unavailable. This is usually brief. Please try again in a few
        minutes.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        If you need urgent help with an active trip, use the support options on our main site.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button to="/">Home</Button>
        <Button variant="secondary" to="/support">
          Support
        </Button>
      </div>
    </div>
  )
}
