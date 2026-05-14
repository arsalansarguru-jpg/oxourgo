'use client'

import dynamic from 'next/dynamic'
import type { Car } from '@/types/car'
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
        <div className="mx-auto h-40 max-w-4xl animate-pulse rounded-3xl bg-fill-glass/80 ring-1 ring-inset ring-stroke/60" />
        <div className="mx-auto mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-72 animate-pulse rounded-2xl bg-fill-glass/60 ring-1 ring-inset ring-stroke/50" />
          <div className="h-72 animate-pulse rounded-2xl bg-fill-glass/60 ring-1 ring-inset ring-stroke/50 sm:block" />
          <div className="hidden h-72 animate-pulse rounded-2xl bg-fill-glass/60 ring-1 ring-inset ring-stroke/50 lg:block" />
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
  return (
    <>
      <HeroSection />
      <HomeBelowFold featuredCars={featuredCars} featuredLoadFailed={featuredLoadFailed} />
    </>
  )
}
