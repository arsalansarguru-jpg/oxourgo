'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, Bot, CarFront, Clock, IndianRupee, RefreshCw, ShieldCheck } from 'lucide-react'
import type { Car } from '@/types/car'
import { destinations } from '@/data/destinations'
import { testimonials } from '@/data/testimonials'
import { HeroSection } from '@/components/marketing/hero-section'
import { Section, SectionHeading } from '@/components/ui/Section'
import { CarCard } from '@/components/fleet/car-card'
import { DestinationCard } from '@/components/marketing/destination-card'
import { FeatureCard } from '@/components/marketing/feature-card'
import { TestimonialCard } from '@/components/marketing/testimonial-card'
import { CTASection } from '@/components/marketing/cta-section'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils/cn'
import { cardSurfaceBase } from '@/components/ui/card-tokens'

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified Cars',
    description: 'Every vehicle undergoes rigorous quality checks and certification',
  },
  {
    icon: IndianRupee,
    title: 'Transparent Pricing',
    description: 'No hidden charges. What you see is what you pay',
  },
  {
    icon: Bot,
    title: '24x7 AI Support',
    description: 'Round-the-clock assistance for a seamless experience',
  },
  {
    icon: Clock,
    title: 'Instant Booking',
    description: 'Book your dream car in under 60 seconds',
  },
] as const

type HomeViewProps = {
  featuredCars: Car[]
  /** Supabase error loading `public.vehicles` for the featured strip. */
  featuredFetchError?: string | null
}

export function HomeView({ featuredCars, featuredFetchError = null }: HomeViewProps) {
  const router = useRouter()
  return (
    <>
      <HeroSection />

      <Section>
        <SectionHeading
          title="Featured Luxury Fleet"
          subtitle="Choose from our premium collection of verified luxury cars"
        />
        <div className="mx-auto grid w-full max-w-[var(--container-wide)] gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {featuredFetchError ? (
            <div className="col-span-full">
              <div
                className={cn(
                  cardSurfaceBase,
                  'rounded-2xl border border-red-400/25 bg-red-500/[0.07] p-6 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-8',
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/15 text-red-200">
                    <AlertTriangle className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="text-lg font-semibold text-soft">Featured fleet unavailable</h3>
                    <p className="text-sm leading-relaxed text-muted">
                      We could not load vehicles from <span className="font-medium text-soft">public.vehicles</span>.
                      Confirm <code className="rounded bg-white/10 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{' '}
                      and your publishable key on Vercel, then check Supabase logs for RLS or schema errors.
                    </p>
                    <p className="font-mono text-xs text-red-200/90">{featuredFetchError}</p>
                    <Button type="button" variant="secondary" className="mt-2" onClick={() => router.refresh()}>
                      <RefreshCw className="h-4 w-4" aria-hidden />
                      Try again
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : featuredCars.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={CarFront}
                title="Featured fleet"
                description="No available vehicles are returned from Supabase yet. Add rows to public.vehicles with availability_status set to available, or mark vehicles as featured."
                actionLabel="Browse fleet"
                to="/fleet"
              />
            </div>
          ) : (
            featuredCars.map((car, i) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-72px 0px' }}
                transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <CarCard car={car} />
              </motion.div>
            ))
          )}
        </div>
        <div className="flex justify-center">
          <Button size="lg" variant="secondary" to="/fleet">
            View All Cars
          </Button>
        </div>
      </Section>

      <Section className="bg-carbon-deep/80">
        <SectionHeading
          title="Popular Destinations"
          subtitle="Explore Mumbai's iconic locations in style"
        />
        <div className="mx-auto grid w-full max-w-[var(--container-wide)] gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-6">
          {destinations.map((d) => (
            <DestinationCard key={d.id} destination={d} />
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading
          title="Why Choose Oxour Go"
          subtitle="Premium self-drive experience with unmatched service"
        />
        <div className="mx-auto grid w-full max-w-[var(--container-wide)] gap-5 md:grid-cols-2 md:gap-6 lg:gap-6">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </Section>

      <Section className="bg-carbon-deep/80">
        <SectionHeading
          title="What Our Customers Say"
          subtitle="Trusted by thousands of premium users"
        />
        <div className="mx-auto grid w-full max-w-[var(--container-wide)] gap-5 md:grid-cols-3 md:gap-6 lg:gap-6">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </Section>

      <CTASection />

      <Section contained={false} className="pb-8 pt-0">
        <div className="container-app text-center text-xs text-silver">
          <p>
            Curated for{' '}
            <Link href="/fleet" className="text-electric hover:underline">
              Mumbai self-drive
            </Link>
            . Read our{' '}
            <Link href="/terms" className="text-electric hover:underline">
              terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-electric hover:underline">
              privacy
            </Link>{' '}
            policies.
          </p>
        </div>
      </Section>
    </>
  )
}
