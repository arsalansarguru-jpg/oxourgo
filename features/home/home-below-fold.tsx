'use client'

import { useRouter } from 'next/navigation'
import { Bot, CarFront, Clock, IndianRupee, RefreshCw, ShieldCheck } from 'lucide-react'
import type { Car } from '@/types/car'
import { Section, SectionHeading } from '@/components/ui/Section'
import { DataLoadErrorPanel } from '@/components/ui/data-load-error'
import { CarCard } from '@/components/fleet/car-card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { WhatsAppInquiryButton } from '@/components/marketing/whatsapp-inquiry-button'

const benefits = [
  { icon: ShieldCheck, label: 'Verified vehicles' },
  { icon: IndianRupee, label: 'Transparent pricing' },
  { icon: Bot, label: '24×7 support' },
  { icon: Clock, label: 'WhatsApp concierge' },
] as const

export type HomeBelowFoldProps = {
  featuredCars: Car[]
  featuredLoadFailed?: boolean
}

export function HomeBelowFold({ featuredCars, featuredLoadFailed = false }: HomeBelowFoldProps) {
  const router = useRouter()

  return (
    <>
      <Section>
        <SectionHeading
          title="Featured vehicles"
          subtitle="Popular picks from our Mumbai fleet."
        />
        <div className="grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredLoadFailed ? (
            <div className="col-span-full">
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
            <div className="col-span-full">
              <EmptyState
                icon={CarFront}
                title="Featured fleet"
                description="Browse the full collection while we update featured vehicles."
                actionLabel="Browse fleet"
                to="/fleet"
              />
            </div>
          ) : (
            featuredCars.map((car) => <CarCard key={car.id} car={car} />)
          )}
        </div>
        <div className="flex justify-center">
          <Button size="lg" variant="secondary" to="/fleet">
            View all vehicles
          </Button>
        </div>
      </Section>

      <Section variant="muted">
        <SectionHeading
          title="Why Oxour Go"
          subtitle="A straightforward self-drive experience."
          align="center"
        />
        <ul className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-lg border border-stroke bg-carbon px-4 py-3.5 shadow-[var(--shadow-card)]"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <span className="text-sm font-medium text-soft">{label}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
          <h2 className="text-section-title text-soft">Ready to book?</h2>
          <p className="text-base leading-relaxed text-muted">
            Message us on WhatsApp with your dates and vehicle preference. We confirm availability before you commit.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <WhatsAppInquiryButton size="lg" label="WhatsApp us" className="w-full sm:w-auto" />
            <Button size="lg" variant="secondary" to="/fleet" className="w-full sm:w-auto">
              Browse fleet
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
