import type { Metadata } from 'next'
import { Suspense } from 'react'

import { HomePageContent } from '@/features/home/home-page-content'
import { HomePageFallback } from '@/features/home/home-page-fallback'
import { buildPageMetadata } from '@/lib/seo/build-page-metadata'

/** Always resolve vehicles from Supabase at request time (Vercel + local). */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildPageMetadata({
  title: 'Luxury self-drive Mumbai',
  description:
    'Discover Oxour Go — verified luxury self-drive vehicles in Mumbai, transparent pricing, concierge support, and instant booking.',
  path: '/',
  keywords: ['Oxour Go home', 'luxury car rental Mumbai', 'self drive booking'],
})

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageContent />
    </Suspense>
  )
}
