'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'
import type { Car } from '@/types/car'

import { captureClientEvent } from '@/lib/analytics/capture-client'
import { BOOKING_FUNNEL, POSTHOG_EVENTS } from '@/lib/analytics/posthog-events'
import { HeroSection } from '@/components/marketing/hero-section'
import { Section } from '@/components/ui/Section'

const HomeBelowFold = dynamic(
  () => import('@/features/home/home-below-fold').then((m) => m.HomeBelowFold),
  {
    ssr: true,
    loading: () => <HomeBelowFoldSkeleton />,
  },
)

function HomeBelowFoldSkeleton() {
  return (
    <Section className="py-[clamp(2.5rem,8vw,5rem)]" aria-busy="true" aria-label="Loading sections">
      <div className="container-app">
        <div className="mx-auto h-32 max-w-4xl animate-pulse rounded-lg bg-carbon-deep" />
        <div className="mx-auto mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-lg bg-carbon-deep" />
          <div className="h-64 animate-pulse rounded-lg bg-carbon-deep sm:block" />
          <div className="hidden h-64 animate-pulse rounded-lg bg-carbon-deep lg:block" />
        </div>
      </div>
    </Section>
  )
}

type HomeViewProps = {
  featuredCars: Car[]
  /** True when featured vehicles could not be loaded (details are server-logged only). */
  featuredLoadFailed?: boolean
}

export function HomeView({ featuredCars, featuredLoadFailed = false }: HomeViewProps) {
  const homeTracked = useRef(false)
  useEffect(() => {
    if (homeTracked.current) return
    homeTracked.current = true
    captureClientEvent(POSTHOG_EVENTS.homepageViewed, {
      funnel: BOOKING_FUNNEL,
      step: 'homepage',
      featured_count: featuredCars.length,
      featured_load_failed: featuredLoadFailed,
    })
  }, [featuredCars.length, featuredLoadFailed])

  return (
    <>
      <HeroSection />
      <HomeBelowFold featuredCars={featuredCars} featuredLoadFailed={featuredLoadFailed} />
    </>
  )
}
