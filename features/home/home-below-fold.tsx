'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bot, CarFront, Clock, IndianRupee, RefreshCw, ShieldCheck } from 'lucide-react'
import type { Car } from '@/types/car'
import { destinations } from '@/data/destinations'
import { testimonials } from '@/data/testimonials'
import { Section, SectionHeading } from '@/components/ui/Section'
import { DataLoadErrorPanel } from '@/components/ui/data-load-error'
import { CarCard } from '@/components/fleet/car-card'
import { DestinationCard } from '@/components/marketing/destination-card'
import { FeatureCard } from '@/components/marketing/feature-card'
import { TestimonialCard } from '@/components/marketing/testimonial-card'
import { CTASection } from '@/components/marketing/cta-section'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

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
    title: 'Concierge booking',
    description: 'Lock dates with our WhatsApp team — fast confirmations and transparent pricing',
  },
] as const

export type HomeBelowFoldProps = {
  featuredCars: Car[]
  featuredLoadFailed?: boolean
}

/** Below-the-fold homepage sections — code-split for lighter initial JS on mobile. */
export function HomeBelowFold({ featuredCars, featuredLoadFailed = false }: HomeBelowFoldProps) {
  const router = useRouter()

  return (
    <>
      <Section>
        <SectionHeading
          title="Featured Luxury Fleet"
          subtitle="Choose from our premium collection of verified luxury cars"
        />
        <div className="mx-auto grid min-w-0 w-full max-w-[var(--container-wide)] gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {featuredLoadFailed ? (
            <div className="col-span-full min-w-0">
              <DataLoadErrorPanel
                title="Unable to load featured fleet"
                description="Please refresh the page or try again shortly."
                onRetry={() => router.refresh()}
                retryLabel={
                  <>
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Try again
                  </>
                }
              />
            </div>
          ) : featuredCars.length === 0 ? (
            <div className="col-span-full min-w-0">
              <EmptyState
                icon={CarFront}
                title="Featured fleet"
                description="We are curating the featured fleet for you. Browse the full collection or check back soon."
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
                className="min-w-0"
              >
                <CarCard car={car} />
              </motion.div>
            ))
          )}
        </div>
        <div className="flex justify-center px-1">
          <Button size="lg" variant="secondary" to="/fleet" className="w-full min-[380px]:w-auto">
            View All Cars
          </Button>
        </div>
      </Section>

      <Section className="bg-carbon-deep/80">
        <SectionHeading
          title="Popular Destinations"
          subtitle="Explore Mumbai's iconic locations in style"
        />
        <div className="mx-auto grid min-w-0 w-full max-w-[var(--container-wide)] gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-6">
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
        <div className="mx-auto grid min-w-0 w-full max-w-[var(--container-wide)] gap-5 md:grid-cols-2 md:gap-6 lg:gap-6">
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
        <div className="mx-auto grid min-w-0 w-full max-w-[var(--container-wide)] gap-5 md:grid-cols-3 md:gap-6 lg:gap-6">
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
