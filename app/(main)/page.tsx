import { Suspense } from 'react'

import { HomePageContent } from '@/features/home/home-page-content'
import { HomePageFallback } from '@/features/home/home-page-fallback'

/** Always resolve vehicles from Supabase at request time (Vercel + local). */
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageContent />
    </Suspense>
  )
}
