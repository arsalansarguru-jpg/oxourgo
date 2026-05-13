import { HeroSection } from '@/components/marketing/hero-section'
import { HomeFeaturedLoading } from '@/features/home/home-featured-loading'

export function HomePageFallback() {
  return (
    <>
      <HeroSection />
      <HomeFeaturedLoading />
    </>
  )
}
