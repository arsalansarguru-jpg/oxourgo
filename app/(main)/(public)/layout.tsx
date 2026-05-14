import type { ReactNode } from 'react'

import { PublicLayout } from '@/components/layout/PublicLayout'

/**
 * Marketing + catalog routes: full navbar, footer, mobile nav, floating WhatsApp.
 * URLs are unchanged — this segment is invisible in the path.
 */
export default function PublicRouteGroupLayout({ children }: { children: ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}
