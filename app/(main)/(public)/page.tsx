import type { Metadata } from 'next'
import { Suspense } from 'react'

import { HomePageContent } from '@/features/home/home-page-content'
import { HomePageFallback } from '@/features/home/home-page-fallback'

/** Always resolve vehicles from Supabase at request time (Vercel + local). */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Discover Oxour Go — verified luxury self-drive vehicles in Mumbai, transparent pricing, and concierge support.',
  openGraph: {
    title: 'Oxour Go — Luxury Self-Drive Mumbai',
    description:
      'Discover Oxour Go — verified luxury self-drive vehicles in Mumbai, transparent pricing, and concierge support.',
  },
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageContent />
    </Suspense>
  )
}
